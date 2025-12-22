import json
import os
import subprocess
import sys
import argparse
from typing import Dict, Any

# --- Constants & Prompts ---

SYSTEM_PROMPT = r"""
You are a professional CV/Resume generation engine embedded in an automated hiring assistant.
Your sole task is to generate a high-quality, ATS-optimized, single-page CV in LaTeX format based strictly on structured user input and a provided job description.

You must prioritize:
factual correctness
ATS compatibility
conciseness
LaTeX compilability
zero hallucination

Non-Negotiable Constraints (CRITICAL)

NO HALLUCINATION
You may NOT invent:
skills, tools, technologies, metrics, achievements
companies, projects, degrees
certifications, dates, or seniority
If a metric is not provided, do NOT fabricate one.
If something is missing, rewrite bullets conservatively (e.g., “contributed to”, “implemented”, “supported”).

TRUTH-ONLY RULE
Every word in the CV must be logically derivable from user-provided data.
You may rephrase, reorder, compress, or prioritize — never add.

OUTPUT MUST BE VALID LaTeX
The output must compile with pdflatex without modification.
Escape all LaTeX special characters: # $ % & _ { } ~ ^ \.
Do not include Markdown.
Do not include explanations, comments, or natural language outside LaTeX.

ATS-FRIENDLY
No icons, tables for layout, text boxes, graphics, or columns that break ATS parsing.
Use simple sections, bullet points, and standard fonts.
No emojis, colors, or visual decorations.

SINGLE PAGE
Target exactly 1 page.
If content exceeds one page:
Remove the least relevant projects first
Then compress bullets
Never shrink font below 10pt

High-Level Task Flow (You MUST follow this order)
Step 1 — Job Description Analysis
Extract internally (do NOT output):
Target role title
Core domain (e.g., backend, data, ML, full-stack)
Hard skill keywords
Soft skill signals
Seniority level
Use this only to prioritize and reorder existing user content.

Step 2 — Content Selection & Prioritization
Experience
Rank experiences by relevance to the job description.
Select the top 1–3 experiences only.
Each experience:
Max 3 bullet points
Each bullet: 1 line, max 25 words

Projects
Select 2–4 projects maximum.
Prioritize:
Tech stack overlap with JD
Recency
Technical depth

Skills
Reorder skills to match JD priority.
Remove skills irrelevant to the JD only if necessary for space.
Do NOT merge or invent categories.

Step 3 — Bullet Point Rewriting Rules
Rewrite bullets to follow this structure:
Action Verb + Technical Task + Context + (Impact IF PROVIDED)

CRITICAL: Optimize for JD Compliance
You MUST use keywords from the job description in your rewrites where factually supported.
e.g., if JD mentions "REST APIs" and user has "built APIs", rewrite to "Built REST APIs...".
e.g., if JD mentions "optimizing performance" and user "fixed queries", rewrite to "Optimized database performance via query tuning...".

Examples:
“Implemented REST APIs in FastAPI to support asynchronous data ingestion”
“Designed PostgreSQL schemas to optimize query performance”
If no impact metric is given, do NOT add one.
Avoid:
Buzzwords without substance
First-person pronouns
Vague phrases (“worked on”, “responsible for”)

Step 4 — Summary Generation
If summary input is empty or weak:
Generate a 2–3 line professional summary
Must include:
Target role
Core technical strengths
Domain focus
Must be fully derivable from provided data

Step 5 — LaTeX Rendering
Produce a complete LaTeX document with:
article class
10pt or 11pt font
Clean margins (≈1.3–1.5 cm)
Include \usepackage{hyperref} for links
Sections in this exact order:
Header (Name, headline, contact info)
Summary
Skills
Experience
Projects
Education

Formatting rules:
Section titles bold
Company/Project names bold
Dates right-aligned using \hfill
Bullet lists using itemize
No page numbers

Output Format (STRICT)
Output ONLY the LaTeX source code.
No explanations.
No backticks.
No Markdown.
No comments.
"""

def call_llm(prompt: str, model: str = "gpt-4o") -> str:
    """
    Calls the LLM provider. currently implemented for OpenAI.
    Requirements: OPENAI_API_KEY environment variable.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable not set.")
        print("Please set your API key to proceed.")
        sys.exit(1)

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2, # Low temperature for more deterministic/strict output
        )
        return response.choices[0].message.content
    except ImportError:
        print("Error: 'openai' package is not installed. Please install it using `pip install openai`.")
        sys.exit(1)
    except Exception as e:
        print(f"Error calling LLM: {str(e)}")
        sys.exit(1)

def extract_latex(text: str) -> str:
    """
    Cleans up the LLM output to ensure only LaTeX is returned.
    Sometimes LLMs wrap code in ```latex ... ``` blocks.
    """
    cleaned = text.strip()
    if cleaned.startswith("```latex"):
        cleaned = cleaned[8:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    
    return cleaned.strip()

def compile_pdf(tex_file: str, output_dir: str):
    """
    Compiles the LaTeX file to PDF using pdflatex.
    """
    if not which("pdflatex"):
        print("Warning: pdflatex not found in PATH. Skipping PDF compilation.")
        return

    print(f"Compiling {tex_file} to PDF...")
    try:
        # Run pdflatex twice to resolve references/layout if needed (though usually once is fine for CVs)
        # We run it in the output directory to keep things clean
        subprocess.run(
            ["pdflatex", "-output-directory", output_dir, "-interaction=nonstopmode", tex_file],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("PDF compilation successful.")
    except subprocess.CalledProcessError as e:
        print("Error compiling PDF:")
        print(e.stderr.decode(errors='replace') if e.stderr else "Unknown error")

def which(program):
    """
    Emulates the 'which' command to check if an executable exists.
    """
    import shutil
    return shutil.which(program)

def main():
    parser = argparse.ArgumentParser(description="Generate a targeted LaTeX CV from JSON Input.")
    parser.add_argument("input_file", help="Path to the JSON input file containing profile and job description.")
    parser.add_argument("--output", "-o", default="cv_output.tex", help="Output LaTeX file path.")
    parser.add_argument("--pdf", action="store_true", help="Compile to PDF after generation.")
    
    args = parser.parse_args()

    # 1. Read Input
    try:
        with open(args.input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file '{args.input_file}' not found.")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Input file '{args.input_file}' is not valid JSON.")
        sys.exit(1)

    # 2. Construct Prompt
    # We pass the raw JSON string to the LLM as the user content
    user_prompt = f"Here is the candidate profile and job description in JSON format:\n\n{json.dumps(data, indent=2)}\n\nGenerate the LaTeX CV now."

    print("Sending request to LLM (this may take a few seconds)...")
    
    # 3. Call LLM
    raw_response = call_llm(user_prompt)
    
    # 4. Process Output
    latex_code = extract_latex(raw_response)
    
    # 5. Save LaTeX
    output_path = os.path.abspath(args.output)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(latex_code)
    
    print(f"LaTeX CV saved to: {output_path}")

    # 6. Compile PDF (Optional)
    if args.pdf:
        output_dir = os.path.dirname(output_path)
        compile_pdf(output_path, output_dir)

if __name__ == "__main__":
    main()
