import instructor
from openai import OpenAI
from pydantic import BaseModel
import json
import os
import re

# Define the metadata schema
class Metadata(BaseModel):
    tags: list[str]
    categories: list[str]
    links: list[str]

# List of blog post folders to process
POSTS = [
    "../bootstrapping-setup",
    "../git-publish",
    "../w-slash-ai"
]

client = instructor.from_openai(OpenAI())

summary = {}

# Ensure output directory exists
out_dir = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(out_dir, exist_ok=True)

def extract_metadata_from_response(result):
    # If result is dict, normalise to attribute-style access helpers
    if isinstance(result, dict):
        class _DictWrapper(dict):
            def __getattr__(self, item):
                val = self.get(item)
                if isinstance(val, dict):
                    return _DictWrapper(val)
                if isinstance(val, list):
                    return [ _DictWrapper(v) if isinstance(v, dict) else v for v in val ]
                return val
        result = _DictWrapper(result)
    # Handle OpenAI function calling/tool_calls
    if callable(getattr(result, 'model_dump', None)):
        # instructor returns a Pydantic model if successful
        return result.model_dump()
    # Fallback: try to extract from tool_calls
    if hasattr(result, 'choices'):
        for choice in result.choices:
            # 1. Tool calls (OpenAI function calling)
            if hasattr(choice.message, 'tool_calls') and choice.message.tool_calls:
                for tool_call in choice.message.tool_calls:
                    try:
                        args = json.loads(tool_call.function.arguments)
                        # If nested, extract 'parameters'
                        if 'function' in args and 'parameters' in args['function']:
                            return args['function']['parameters']
                        if 'data' in args:
                            return args['data']
                        if 'value' in args:
                            return args['value']
                        return args
                    except Exception:
                        continue
            # 2. Message content (markdown code block, separate blocks, inline JSON, or bullet lists)
            if hasattr(choice.message, 'content') and choice.message.content:
                content = choice.message.content
                # Try to extract a single JSON code block
                code_block = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', content)
                if code_block:
                    try:
                        return json.loads(code_block.group(1))
                    except Exception:
                        pass
                # Try to extract three separate code blocks for tags, categories, links
                blocks = re.findall(r'\*\*Tags\*\*[\s\S]+?(?=\*\*Categories\*\*|\*\*Links\*\*|$)|\*\*Categories\*\*[\s\S]+?(?=\*\*Tags\*\*|\*\*Links\*\*|$)|\*\*Links\*\*[\s\S]+?(?=\*\*Tags\*\*|\*\*Categories\*\*|$)', content)
                if blocks:
                    meta = {}
                    for block in blocks:
                        if block.startswith('**Tags**'):
                            # Try code block first
                            tags_block = re.search(r'```[\s\S]+?```', block)
                            if tags_block:
                                try:
                                    meta['tags'] = json.loads(tags_block.group(0).strip('`\n '))
                                    continue
                                except Exception:
                                    pass
                            # Fallback: parse markdown bullet list
                            tags = re.findall(r'\*\s*"([^"]+)"', block)
                            if tags:
                                meta['tags'] = tags
                        elif block.startswith('**Categories**'):
                            cat_block = re.search(r'```[\s\S]+?```', block)
                            if cat_block:
                                try:
                                    meta['categories'] = json.loads(cat_block.group(0).strip('`\n '))
                                    continue
                                except Exception:
                                    pass
                            categories = re.findall(r'\*\s*"([^"]+)"', block)
                            if categories:
                                meta['categories'] = categories
                        elif block.startswith('**Links**'):
                            links_block = re.search(r'```[\s\S]+?```', block)
                            if links_block:
                                try:
                                    meta['links'] = json.loads(links_block.group(0).strip('`\n '))
                                    continue
                                except Exception:
                                    pass
                            # Fallback: parse markdown bullet list for links (if any)
                            links = re.findall(r'\*\s*"([^"]+)"', block)
                            if links:
                                meta['links'] = links
                            # If "None provided" or similar, set to []
                            if 'none provided' in block.lower():
                                meta['links'] = []
                    # Only return if at least tags and categories are present
                    if 'tags' in meta and 'categories' in meta and 'links' in meta:
                        return meta
                # Try to extract JSON from the first curly brace onwards
                brace_index = content.find('{')
                if brace_index != -1:
                    try:
                        return json.loads(content[brace_index:])
                    except Exception:
                        pass
                # Fallback: parse markdown sections with bullet lists
                def extract_section(section_name):
                    pattern = rf'\*\*{section_name}\*\*\s*([\s\S]+?)(?=\*\*|$)'
                    match = re.search(pattern, content, re.IGNORECASE)
                    if match:
                        section = match.group(1)
                        items = re.findall(r'\*\s*"([^"]+)"', section)
                        if not items and 'none provided' in section.lower():
                            return []
                        return items
                    return None
                tags = extract_section('Tags')
                categories = extract_section('Categories')
                links = extract_section('Links')
                if tags is not None and categories is not None and links is not None:
                    return {'tags': tags, 'categories': categories, 'links': links}
    return None

for post_path in POSTS:
    md_path = os.path.join(post_path, "README.md")
    post_name = os.path.basename(post_path)
    abs_post_path = os.path.abspath(post_path)
    abs_md_path = os.path.abspath(md_path)
    print(f"[DEBUG] post_path: {post_path} (abs: {abs_post_path})")
    print(f"[DEBUG] md_path: {md_path} (abs: {abs_md_path})")
    if not os.path.exists(md_path):
        print(f"[WARN] {md_path} does not exist, skipping.")
        continue
    llm_path = os.path.join(out_dir, f"{post_name}.llm.json")
    # Check cache: if .llm.json exists and is newer than README.md, use it
    use_cache = False
    if os.path.exists(llm_path):
        llm_mtime = os.path.getmtime(llm_path)
        md_mtime = os.path.getmtime(md_path)
        if llm_mtime > md_mtime:
            use_cache = True
    if use_cache:
        print(f"[CACHE] Using cached LLM output for {post_name}")
        with open(llm_path, "r") as f:
            result = json.load(f)
    else:
        with open(md_path, 'r') as f:
            content = f.read()
        prompt = f"""
Extract the following metadata from the markdown blog post below:
- Tags (as a list of keywords)
- Categories (as a list)
- Links (as a list of URLs)

Markdown:
---
{content}
---

Respond in JSON with keys: tags, categories, links.
"""
        try:
            result = client.chat.completions.create(
                model="ollama/llama3",
                messages=[
                    {"role": "user", "content": prompt},
                ],
                response_model=Metadata,
            )
        except Exception as e:
            print(f"[WARN] Instructor call failed: {e}")
            raw_client = OpenAI()
            result = raw_client.chat.completions.create(
                model="ollama/llama3",
                messages=[
                    {"role": "user", "content": prompt},
                ],
            )
        # Save raw LLM output to cache
        with open(llm_path, "w") as f:
            if hasattr(result, 'model_dump_json'):
                f.write(result.model_dump_json(indent=2))
            else:
                json.dump(result, f, indent=2)
    # Always extract and write only the metadata dict to .metadata.json
    metadata = extract_metadata_from_response(result)
    if metadata and isinstance(metadata, dict):
        out_path = os.path.join(out_dir, f"{post_name}.metadata.json")
        with open(out_path, "w") as out_f:
            json.dump(metadata, out_f, indent=2)
        print(f"[OK] Metadata for {post_name} saved to {out_path}")
        summary[post_name] = metadata
    else:
        print(f"[FAIL] Could not extract metadata for {post_name}")

# Save summary
summary_path = os.path.join(out_dir, "summary.json")
with open(summary_path, "w") as sum_f:
    json.dump(summary, sum_f, indent=2)
print(f"\nSummary of extracted metadata saved to {summary_path}") 