import { NextRequest, NextResponse } from "next/server";
// Polyfill DOMMatrix for pdf-parse/pdfjs compatibility in Node.js
if (typeof global.DOMMatrix === "undefined") {
  (global as any).DOMMatrix = class DOMMatrix {};
}
const pdf = require("pdf-parse/lib/pdf-parse.js");
const mammoth = require("mammoth");
import OpenAI from "openai";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let extractedText = "";

    // Extract text based on file type
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const data = await pdf(buffer);
      extractedText = data.text;
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload a PDF or DOCX." }, { status: 400 });
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: "Could not extract text from the file." }, { status: 400 });
    }

    // Call OpenAI to parse the extracted text
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Parse this resume. Fix any broken Turkish characters (e.g., ş, ğ, ı) based on context. 
          Return a strictly formatted JSON with exactly these keys: 
          - name (string)
          - email (string)
          - phone (string)
          - location (string)
          - summary (string)
          - education (array of objects with keys: degree, school, gpa, startDate, endDate)
          - experience (array of objects with keys: role, company, startDate, endDate, bullets (array of strings))
          - skills (array of strings)
          
          If a field is not found, use an empty string or empty array.`,
        },
        {
          role: "user",
          content: extractedText,
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsedContent = response.choices[0].message.content;
    if (!parsedContent) {
      throw new Error("Failed to get response from AI");
    }

    const parsedData = JSON.parse(parsedContent);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Resume Parsing Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while parsing the resume." },
      { status: 500 }
    );
  }
}
