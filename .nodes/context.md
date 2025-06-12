# Project Context & Design Summary

This document captures the essential context, requirements, and design principles for the AI-assisted static blog project. It is intended as a persistent reference for future AI (now nodes) assistants and contributors.

---

## Core Principles
- **Minimal root directory surface area:** Only blog post folders, build/, ai/, .github/, site.yaml, and README.md in the root.
- **No existing static site generators:** All build logic is custom, using TypeScript/Bun.
- **Minimal JavaScript:** Start with pure HTML/CSS; add JS only for essential interactivity (e.g., chatbot).
- **AI for metadata only:** AI extracts tags, categories, links, and references at build time. No content rewriting or enhancement by AI during build.
- **Extensible, modular pipeline:** Easy to add new AI steps, metadata fields, or output formats.

---

## Directory Structure (Target)
```
/ (root)
├── site.yaml                # Site-wide config (remains at root)
├── build/                   # All build logic, source, theme, scripts, etc.
├── ai/                      # AI workflows, notes, and requirements
│   └── README.md            # Project requirements and pipeline spec
│   └── context.md           # (this file)
├── .github/                 # GitHub workflows and automation
├── README.md                # Project-wide documentation (root)
├── my-first-post/           # Blog post folder (contains README.md)
│   └── README.md
├── another-post/
│   └── README.md
└── ... (more blog post folders)
```

---

## AI & Metadata Extraction
- **Tools:** DSPy (LLM pipeline), UV (data handling), Ollama (local LLMs on MacBook Air 24GB RAM).
- **Recommended models:** Llama 3 8B, Phi-3 Mini, Mistral 7B, Gemma 2B/7B.
- **Other local AI options:** LM Studio, LocalAI, llama.cpp, GPT4All.
- **Extracted metadata:** tags, categories, links, external references.
- **No AI content rewriting at build time.**

---

## Frontend Chatbot UI
- **"Talk to the author" feature:**
  - Minimal, accessible chat widget.
  - Simulated (canned) responses initially; no backend required at first.
  - Designed for easy future integration with local LLMs (Ollama + DSPy).
  - Placement (floating, sidebar, embedded) to be decided.

---

## Project Workflow
1. Author creates/edits blog post folders with README.md content.
2. Build script discovers posts, runs AI metadata extraction, and generates static HTML/CSS output.
3. Chatbot UI is included in the frontend, with simulated responses (future: real LLM integration).

---

## Design Intent
- **Author-driven content:** All content enhancement is done by the author, not by AI at build time.
- **AI augments with metadata only.**
- **Static, privacy-friendly, and modern by default.**

---

**This file is a persistent context anchor for future AI and human contributors.** 