# Makefile for backend (LLM metadata extraction pipeline)

# Python interpreter (use venv if activated)
PY ?= python

# Paths
EXTRACT   := extract_metadata.py
DATA_DIR  := data

## Default target: run the extraction script (uses caching)
llm:
	$(PY) $(EXTRACT)

## Remove cached raw LLM responses
clean-cache:
	rm -f $(DATA_DIR)/*.llm.json || true

## Remove generated metadata (clean output)
clean-meta:
	rm -f $(DATA_DIR)/*.metadata.json $(DATA_DIR)/summary.json || true

## Full clean (cache + metadata)
clean: clean-cache clean-meta

## Force-rebuild: clean, then regenerate everything (ignores cache)
rebuild:
	$(MAKE) clean
	$(PY) $(EXTRACT) --force

.PHONY: llm clean-cache clean-meta clean rebuild 