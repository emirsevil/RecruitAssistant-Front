import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a professional CV/Resume generation engine embedded in an automated hiring assistant and a Harvard resume formatting specialist.
Your sole task is to generate a high-quality, ATS-optimized, single-page CV in strict Harvard Resume Format based strictly on structured user input and a provided job description.

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

HARVARD RESUME FORMAT (STRICT)
The CV/PDF and HTML preview must follow the official Harvard-style resume format:
- Classic serif typography throughout (Times New Roman, Georgia, Garamond, or equivalent).
- Strictly black text on a white background.
- No colors, no gray text, no icons, no progress bars, no decorative dividers except black section rules.
- No multi-column layouts.
- Full name centered, large, bold, uppercase.
- Contact information centered below the name, one line only, separated with |.
- Include LinkedIn and GitHub/portfolio links in the same contact line when provided.
- Section headings left-aligned, bold, uppercase, with a solid black horizontal line directly underneath.
- Education and Experience line 1: organization/company bold on left, location normal on right.
- Education and Experience line 2: degree/job title italic on left, dates normal on right.
- No extra margin between line 1 and line 2.
- Bullets must use standard disc bullets with slight left indentation.
- Project title must be bold on the left and project date right-aligned on the same line when provided.
- Skills must be plain comma-separated technical skills, never chips/tags/badges.
- Do not create a Soft Skills section, Soft Skills category, or Soft Skills bullets.

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
- Use a classic serif font only
- Section titles bold and uppercase
- Add a solid black rule directly under every section title
- Company/school/project names bold
- Locations and dates right-aligned using \hfill
- Role/degree titles italic
- Project dates right-aligned on the same line as project names using \hfill
- Bullet lists using standard itemize
- Skills as comma-separated plain technical text; no Soft Skills category
- No page numbers

Output Format (STRICT)
You must output a JSON object with two fields:
1. "latex": The LaTeX source code.
2. "html": A complete, single-file HTML representation using Tailwind CSS for styling.

Language Rule:
Follow the language specified in the language field in the input given to you
FOLLOW THE LANGUAGE SPECIFIED IN THE LANGUAGE FIELD IN THE INPUT
FOLLOW THE LANGUAGE SPECIFIED IN THE LANGUAGE FIELD IN THE INPUT
FOLLOW THE LANGUAGE SPECIFIED IN THE LANGUAGE FIELD IN THE INPUT
FOLLOW THE LANGUAGE SPECIFIED IN THE LANGUAGE FIELD IN THE INPUT
FOLLOW THE LANGUAGE SPECIFIED IN THE LANGUAGE FIELD IN THE INPUT

HTML Rules:
- Use Tailwind CSS via CDN.
- Aspect ratio A4.
- Strict Harvard resume style.
- Entire resume uses font-serif.
- Clean, compact, black text on white background.
- No icons, no colors, no gray text, no progress bars, no cards, no chips, no multi-column layouts.
- Header name: text-center text-2xl font-bold uppercase.
- Contact line: text-center text-sm with | separators, including LinkedIn and GitHub/portfolio links when present.
- Section headings: text-left font-bold uppercase text-md mt-4 border-b border-black pb-1 mb-2.
- Education/Experience rows: flex justify-between, bold left organization, normal right location; second row italic left title, normal right dates.
- Project row: flex justify-between, bold left project title, normal right project date.
- Bullet lists: ul.list-disc.ml-5.leading-snug.
- Skills: comma-separated technical plain text. No Soft Skills.

Return ONLY the raw JSON.`;

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
        links: {
          linkedin: body.linkedin,
          github: body.github,
          ...(body.links || {})
        }
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
        date: proj.date,
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

Target Language: ${body.language || "English"}
Generate the CV in ${body.language || "English"}.`;

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
