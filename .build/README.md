# .build

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.14. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

# .build Directory

This directory contains build scripts and output for the blog system.

# Theme Directory

> The `/theme/` directory should be created at the root of the blog project (next to `site.yaml`), not inside `.build`.

## Theme System

A new `/theme/` directory will be created at the root of the blog project. This directory will contain:
- `variables.css`: CSS custom properties for colors, spacing, etc.
- `fonts.css`: Google Fonts imports (Inter, Roboto, etc.)
- `base.css`: Base theme styles (body, headings, etc.)
- `components.css`: Card, button, and UI component styles

**How to use:**
- Edit `site.yaml` to set your site preferences (title, tagline, theme colors, etc.)
- The build script will read `site.yaml` and inject the theme CSS into the output HTML.
- To change the look, edit the theme CSS files or update theme options in `site.yaml`.

This separation makes the theme reusable and swappable, and keeps site config/content cleanly separated from styling.

## Running the LiteLLM Proxy (OpenAI-compatible API for Ollama)

To start the LiteLLM proxy (so your local Llama 3 model is available via OpenAI-compatible API):

```sh
cd .build
source .venv/bin/activate.fish
litellm --config litellm.yaml
```

- Make sure you are in the `.build` directory (where `litellm.yaml` and `.venv` are).
- This will start the proxy on the default port (usually 8000 or 4000).
- Your Python scripts can now use `OPENAI_API_KEY` and `OPENAI_BASE_URL` as set in `.envrc`.

## Metadata Extraction Output

- All extracted metadata is saved to `.build/data/`.
- Each blog post gets a file: `.build/data/<post>.metadata.json`
- A summary of all extracted metadata is saved to `.build/data/summary.json`

Example:
```sh
ls .build/data/
# bootstrapping-setup.metadata.json  git-publish.metadata.json  w-slash-ai.metadata.json  summary.json
```

If `.build/data/` does not exist, it will be created automatically by the extraction script.

---
