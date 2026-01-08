from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import regex as re

app = FastAPI()

# Load env vars
os.environ["ANTHROPIC_API_KEY"] = os.getenv("CLAUDE_API_KEY", "")

# PII redaction regex (simple example: names, emails, etc.)
PII_REGEX = r'(\b[A-Z][a-z]+ [A-Z][a-z]+\b)|(\b[\w\.-]+@[\w\.-]+\b)'

def sanitize_text(text: str) -> str:
    return re.sub(PII_REGEX, '[REDACTED]', text)

def _snippet(text: str, keyword: str, window: int = 80) -> str:
    idx = text.lower().find(keyword)
    if idx == -1:
        return ""
    start = max(0, idx - window)
    end = min(len(text), idx + len(keyword) + window)
    return text[start:end].strip()

def _simple_type(text: str) -> str:
    t = text.lower()
    if "non-disclosure" in t or "confidential" in t:
        return "NDA"
    if "employment" in t or "employee" in t:
        return "Employment Agreement"
    if "lease" in t or "landlord" in t or "tenant" in t:
        return "Lease Agreement"
    if "service" in t or "services" in t:
        return "Service Agreement"
    if "purchase" in t or "supplier" in t:
        return "Purchase Agreement"
    return "General Contract"

def _simple_clauses(text: str):
    clauses = []
    keywords = [
        ("term", "Term"),
        ("termination", "Termination"),
        ("payment", "Payment"),
        ("liability", "Liability"),
        ("governing law", "Governing Law"),
        ("confidential", "Confidentiality"),
    ]
    for key, title in keywords:
        snippet = _snippet(text, key)
        if snippet:
            clauses.append({"title": title, "text": snippet})
    if not clauses:
        clauses.append({"title": "Summary", "text": "No obvious clauses detected in demo mode."})
    return clauses

def _simple_risks(text: str):
    risks = []
    t = text.lower()
    if "unlimited" in t and "liability" in t:
        risks.append({
            "level": "high",
            "description": "Potential unlimited liability exposure",
            "explanation": "Contract mentions unlimited liability terms."
        })
    if "indemnify" in t or "indemnification" in t:
        risks.append({
            "level": "medium",
            "description": "Indemnification obligations present",
            "explanation": "Indemnification clause detected; review scope."
        })
    if "governing law" in t and "california" in t:
        risks.append({
            "level": "low",
            "description": "Specific governing law clause",
            "explanation": "Governing law set; confirm jurisdiction fit."
        })
    return risks

def demo_triage(text: str):
    return {
        "type": _simple_type(text),
        "clauses": _simple_clauses(text),
        "risks": _simple_risks(text)
    }

DEMO_MODE = os.getenv("DEMO_MODE", "").lower() in ("1", "true", "yes")
HAVE_FULL_STACK = False

if not DEMO_MODE:
    try:
        from crewai import Agent, Task, Crew
        from langchain.embeddings import HuggingFaceEmbeddings
        from langchain.vectorstores import FAISS
        from langchain.chains import RetrievalQA
        from langchain_anthropic import ChatAnthropic  # Or Gemini if preferred
        from langchain.document_loaders import PyPDFDirectoryLoader  # For loading templates
        from langchain.text_splitter import RecursiveCharacterTextSplitter

        templates_dir = "legal_templates"
        has_templates = os.path.isdir(templates_dir) and any(os.scandir(templates_dir))
        if has_templates:
            embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
            loader = PyPDFDirectoryLoader("legal_templates/")
            documents = loader.load()
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            texts = text_splitter.split_documents(documents)
            vectorstore = FAISS.from_documents(texts, embeddings)
            llm = ChatAnthropic(model="claude-3-sonnet-20240229")  # 2026 model
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=vectorstore.as_retriever()
            )

            # Guardrail function: Check for ethical issues or low confidence
            def guardrail_check(query: str, response: str) -> bool:
                harmful_terms = ["illegal", "exploit", "harm"]
                return not any(term in response.lower() for term in harmful_terms)

            # Agents
            classifier = Agent(
                role='Document Classifier',
                goal='Classify contract type accurately without processing PII',
                backstory='Expert in legal taxonomy; uses RAG to reference templates.',
                tools=[qa_chain],
                llm=llm,
                verbose=True
            )

            extractor = Agent(
                role='Clause Extractor',
                goal='Extract key clauses securely',
                backstory='Focuses on business terms; redacts any potential PII.',
                tools=[qa_chain],
                llm=llm,
                verbose=True
            )

            flagger = Agent(
                role='Risk Flagger',
                goal='Flag risks based on regulations with explanations',
                backstory='Compares to EU/GDPR standards; provides traceable reasoning.',
                tools=[qa_chain],
                llm=llm,
                verbose=True
            )

            HAVE_FULL_STACK = True
        else:
            DEMO_MODE = True
    except Exception:
        DEMO_MODE = True

class TriageInput(BaseModel):
    document_content: str

@app.post("/triage")
async def triage_document(input: TriageInput):
    sanitized = sanitize_text(input.document_content)
    if DEMO_MODE or not HAVE_FULL_STACK:
        return {"result": demo_triage(sanitized)}

    if 'pii_detected' in sanitized:  # Dummy check
        raise HTTPException(status_code=400, detail="PII detected - abort")

    task1 = Task(
        description=f'Classify the document type from content (anonymized): {sanitized[:500]}',
        agent=classifier
    )  # Truncate for prompt
    task2 = Task(
        description=f'Extract clauses like parties, terms, obligations from: {sanitized[:500]}',
        agent=extractor
    )
    task3 = Task(
        description=f'Flag risks (e.g., non-compliant clauses) with RAG references for: {sanitized[:500]}',
        agent=flagger
    )

    crew = Crew(agents=[classifier, extractor, flagger], tasks=[task1, task2, task3], verbose=2)
    result = crew.kickoff()

    # Post-guardrail
    if not guardrail_check(sanitized, str(result)):
        raise HTTPException(status_code=400, detail="Guardrail violation")

    return {"result": result}
