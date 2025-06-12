import instructor
from openai import OpenAI
from pydantic import BaseModel
import json
import os

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
    # Handle OpenAI function calling/tool_calls
    if hasattr(result, 'model_dump'):
        # instructor returns a Pydantic model if successful
        return result.model_dump()
    # Fallback: try to extract from tool_calls
    if hasattr(result, 'choices'):
        for choice in result.choices:
            if hasattr(choice.message, 'tool_calls') and choice.message.tool_calls:
                for tool_call in choice.message.tool_calls:
                    try:
                        args = json.loads(tool_call.function.arguments)
                        # If nested, extract 'parameters'
                        if 'function' in args and 'parameters' in args['function']:
                            return args['function']['parameters']
                        return args
                    except Exception:
                        continue
    return None

for post_path in POSTS:
    md_path = os.path.join(post_path, "README.md")
    post_name = os.path.basename(post_path)
    if not os.path.exists(md_path):
        print(f"[WARN] {md_path} does not exist, skipping.")
        continue
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
    result = client.chat.completions.create(
        model="ollama/llama3",
        messages=[
            {"role": "user", "content": prompt},
        ],
        response_model=Metadata,
    )
    metadata = extract_metadata_from_response(result)
    if metadata:
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