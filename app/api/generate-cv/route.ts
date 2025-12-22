import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a professional CV/Resume generation engine embedded in an automated hiring assistant.
Your sole task is to generate a high-quality, ATS-optimized, single-page CV based strictly on structured user input and a provided job description.

You must output a JSON object with two fields:
1. "latex": The LaTeX source code.
2. "html": A complete, single-file HTML representation using Tailwind CSS for styling, optimized for printing to PDF (A4 size).

OUTPUT FORMAT:
Return ONLY a raw JSON object. Do not wrap it in markdown code blocks.
{
  "latex": "...",
  "html": "..."
}

### Field 1: LaTeX Rules
- Must compile with pdflatex without modification.
- Escape all special characters.
- Start with \\documentclass{article}.
- Strict 1 page limit (adjust spacing if needed).

### Field 2: HTML Rules
- Use Tailwind CSS via CDN script tag: <script src="https://cdn.tailwindcss.com"></script>
- Use A4 aspect ratio and styling.
- Ensure "print" styles are applied so it looks perfect when printed to PDF.
- Use a clean, professional, black & white layout resembling the LaTeX version.
- Font: Inter or system-ui.

### General Content Rules
- NO HALLUCINATION: Do not invent skills, companies, or metrics.
- TRUTH-ONLY: Every word must be derivable from input.
- ATS-FRIENDLY: Simple hierarchy, standard headings.`;

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

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || "OpenAI API error" },
        { status: response.status }
      );
    }

    const data = await response.json();
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
