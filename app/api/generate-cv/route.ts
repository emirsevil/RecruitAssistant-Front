import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a professional CV/Resume generation engine embedded in an automated hiring assistant.
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
Include usepackage{hyperref} for links
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
No comments.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Build the JSON structure expected by the prompt
    const cvInput = {
      header: {
        name: body.name,
        headline: body.targetJob || "Software Engineer",
        location: body.location,
        email: body.email,
        phone: body.phone,
        links: body.links || {}
      },
      summary: body.summary,
      education: body.education?.map((edu: any) => ({
        school: edu.school,
        degree: edu.degree,
        department: "",
        dates: `${edu.startDate} - ${edu.endDate}`,
        gpa: edu.gpa
      })) || [],
      experience: body.experience?.map((exp: any) => ({
        company: exp.company,
        role: exp.role,
        location: "",
        dates: `${exp.startDate} - ${exp.endDate}`,
        bullets: exp.bullets
      })) || [],
      projects: body.projects?.map((proj: any) => ({
        name: proj.title,
        stack: proj.techStack,
        link: "",
        bullets: [proj.description]
      })) || [],
      skills: {
        "Technical Skills": body.skills || []
      },
      job_description: body.targetJob
    };

    const userPrompt = `Here is the candidate profile and job description in JSON format:

${JSON.stringify(cvInput, null, 2)}

Generate the LaTeX CV now.`;

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = "OpenAI API error";
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error("Failed to parse OpenAI response (Invalid JSON)");
    }

    let content = data.choices[0]?.message?.content || "";

    // Clean up code blocks if needed
    if (content.startsWith("```json")) {
      content = content.slice(7);
    } else if (content.startsWith("```")) {
      content = content.slice(3);
    }
    if (content.endsWith("```")) {
      content = content.slice(0, -3);
    }
    content = content.trim();

    let output = { latex: "", html: "" };
    try {
      output = JSON.parse(content);
    } catch (e) {
      // Fallback if valid JSON wasn't returned
      console.error("Failed to parse JSON from LLM:", e);
      output.latex = content; // Assume it dumped raw text if parse fails
    }

    return NextResponse.json({
      latex: output.latex,
      html: output.html,
      success: true
    });

  } catch (error: any) {
    console.error("CV Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate CV" },
      { status: 500 }
    );
  }
}
