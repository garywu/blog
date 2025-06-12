# Project To-Do List

This is a living task list for the AI-assisted static blog project. Update as tasks are completed or new ones are added.

---

## Minimum Proof of Concept (MVP)

### 1. AI Pipeline (Metadata Extraction)
- [ ] Set up a minimal DSPy script that:
    - [ ] Reads a sample markdown file (use an actual blog post, e.g., my-first-post/README.md)
    - [ ] Connects to a local Ollama model (e.g., llama3:8b)
    - [ ] Extracts tags, categories, and links (simply prints them for now)

### 2. Frontend Pipeline
- [ ] Create a minimal HTML template for a blog post
- [ ] Add a placeholder for metadata (tags, categories, links)
- [ ] Add a simple "Talk to the author" chat UI with canned responses

### 3. Local AI Setup
- [ ] Document how to install and run Ollama on Mac
- [ ] Document how to pull and run a supported model (e.g., llama3:8b)
- [ ] Test local inference with a sample prompt

---

## Development Environment Setup (Hybrid Nix + venv + uv)

1. `cd ai`
2. `nix develop` (enter the Nix shell; provides Python and system deps)
3. `python -m venv .venv` (create a virtual environment if not already present)
4. `source .venv/bin/activate` (activate the venv)
5. `uv pip install -r requirements.txt` (install all Python dependencies, including dspy)
6. Run the script: `python extract_metadata.py [path/to/README.md]`

---

## Next Steps (after MVP)
- [ ] Integrate AI metadata extraction into the build pipeline
- [ ] Output metadata into HTML (meta tags or JSON)
- [ ] Refine chat UI and plan for real LLM integration
- [ ] Add more robust error handling and logging

---

**Update this file as tasks are completed or new requirements emerge.** 