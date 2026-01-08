import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Tabs,
  Tab,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CssBaseline,
  Chip,
  Stack,
  Paper
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dropzone from 'react-dropzone';
import { gsap } from 'gsap';

function App() {
  const rootRef = useRef(null);
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('cicero-theme') || 'light';
  });
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState(0);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/triage';

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { duration: 0.8, ease: 'power3.out' } });
      tl.from('.js-toggle', { autoAlpha: 0, y: -12 }, 0)
        .from('.js-wordmark', { autoAlpha: 0, y: 12 }, 0.1)
        .from('.js-headline', { autoAlpha: 0, y: 18 }, 0.18)
        .from('.js-subhead', { autoAlpha: 0, y: 14 }, 0.26)
        .from('.js-chips > *', { autoAlpha: 0, y: 10, stagger: 0.08 }, 0.3)
        .from('.js-dropzone', { autoAlpha: 0, y: 20, scale: 0.98 }, 0.22)
        .from('.js-info-card', { autoAlpha: 0, y: 18, stagger: 0.1 }, 0.4)
        .from('.js-footer', { autoAlpha: 0 }, 0.6);
    }, rootRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const handleUpload = async (files) => {
    const content = await files[0].text();  // Assume text/PDF parse client-side or send blob
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_content: content })
    });
    const data = await response.json();
    setResult(data.result);
  };

  const toggleMode = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('cicero-theme', next);
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: { main: mode === 'light' ? '#0B5C4D' : '#63c5b3' },
      secondary: { main: mode === 'light' ? '#A86B2E' : '#d5a06a' },
      background: {
        default: mode === 'light' ? '#F7F3EE' : '#0f1110',
        paper: mode === 'light' ? '#ffffff' : '#151a18'
      },
      text: {
        primary: mode === 'light' ? '#1f1f1f' : '#f4f1ec',
        secondary: mode === 'light' ? '#6c6b67' : '#b9b4aa'
      }
    },
    typography: {
      fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h6: { fontWeight: 600 }
    },
    shape: { borderRadius: 16 }
  });

  const clauses = result?.clauses || [];
  const risks = result?.risks || [];

  useEffect(() => {
    if (!result) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.js-results',
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }, rootRef);
    return () => ctx.revert();
  }, [result]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-shell" ref={rootRef}>
        <div className="page-content">
          <Container maxWidth="lg">
            <Box className="top-bar">
              <button
                type="button"
                className="theme-toggle js-toggle"
                data-mode={mode}
                aria-pressed={mode === 'dark'}
                onClick={toggleMode}
              >
                <span className="theme-label">Light</span>
                <span className="theme-switch" aria-hidden="true">
                  <span className="theme-thumb" />
                </span>
                <span className="theme-label">Dark</span>
              </button>
            </Box>
            <Box className="hero">
              <Box className="hero-copy">
                <div className="brand-row">
                  <span className="wordmark js-wordmark">MINAIRVA</span>
                  <span className="brand-tag">Legal AI</span>
                </div>
                <Typography variant="h3" className="js-headline">MINAIRVA - Legal Document Triage Agent</Typography>
                <Typography variant="body1" className="hero-sub js-subhead">
                  Upload a contract to classify it, extract key clauses, and flag risks with
                  explainable summaries.
                </Typography>
                <Stack direction="row" spacing={1} className="tag-row js-chips">
                  <Chip label="PII redaction" size="small" />
                  <Chip label="Human review ready" size="small" />
                  <Chip label="Jurisdiction aware" size="small" />
                </Stack>
              </Box>
              <Paper className="hero-card js-dropzone" elevation={6}>
                <Dropzone onDrop={handleUpload}>
                  {({ getRootProps, getInputProps }) => (
                    <section {...getRootProps()} className="dropzone">
                      <input {...getInputProps()} />
                      <Typography variant="h6">Drop a document to analyze</Typography>
                      <Typography variant="body2" className="dropzone-sub">
                        PDF, DOCX, or TXT • demo mode supported
                      </Typography>
                      <Button variant="contained" className="dropzone-cta">
                        Select File
                      </Button>
                    </section>
                  )}
                </Dropzone>
              </Paper>
            </Box>

            <Box className="info-grid">
              <Box className="info-card js-info-card">
                <Typography variant="h6">How it works</Typography>
                <ol>
                  <li>Text is sanitized to remove PII.</li>
                  <li>Clauses are extracted and grouped.</li>
                  <li>Risks are flagged with rationale.</li>
                </ol>
              </Box>
              <Box className="info-card js-info-card">
                <Typography variant="h6">Typical outputs</Typography>
                <ul>
                  <li>Contract type & category</li>
                  <li>Termination and liability clauses</li>
                  <li>Risk flags for review</li>
                </ul>
              </Box>
            </Box>

            {result && (
              <Box className="results js-results">
                <Tabs value={tab} onChange={(e, v) => setTab(v)} className="result-tabs">
                  <Tab label="Classification" />
                  <Tab label="Clauses" />
                  <Tab label="Risks" />
                </Tabs>
                <Box className="result-panel">
                  {tab === 0 && (
                    <Paper className="result-card">
                      <Typography variant="h6">Document Type</Typography>
                      <Typography variant="body1">{result.type}</Typography>
                    </Paper>
                  )}
                  {tab === 1 && (
                    <Box className="result-stack">
                      {clauses.map((clause, i) => (
                        <Accordion key={i} className="clause-accordion">
                          <AccordionSummary>{clause.title}</AccordionSummary>
                          <AccordionDetails>{clause.text}</AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  )}
                  {tab === 2 && (
                    <Box className="result-stack">
                      {risks.length === 0 && (
                        <Paper className="result-card">
                          <Typography variant="body1">No risks detected in demo mode.</Typography>
                        </Paper>
                      )}
                      {risks.map((risk, i) => (
                        <Paper key={i} className={`risk-card risk-${risk.level}`}>
                          <Typography variant="subtitle1">{risk.description}</Typography>
                          <Typography variant="body2">{risk.explanation}</Typography>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
                <Button variant="contained" className="review-btn">
                  Review in Chat
                </Button>
              </Box>
            )}
          </Container>
        </div>
        <footer className="site-footer js-footer">© 2026 BY BLUE LABS</footer>
      </Box>
    </ThemeProvider>
  );
}

export default App;
