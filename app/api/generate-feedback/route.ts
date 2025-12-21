import { NextResponse } from "next/server";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function POST(req: Request) {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "API Key not found" }, { status: 500 });
        }

        const { topic, score, totalQuestions, difficulty } = await req.json();

        const prompt = `
        You are a strict but constructive coding interviewer. A candidate just finished a quiz on "${topic}" (${difficulty} difficulty).
        
        Their Score: ${score} out of ${totalQuestions} (${Math.round((score / totalQuestions) * 100)}%).

        Task: Provide a short paragraph (2-3 sentences) of descriptive and honest feedback.
        
        Guidelines:
        - If the score is low (<50%), be honest about them needing more study. Do not be overly cheerful.
        - If the score is high (>80%), commend their mastery.
        - If the score is average, suggest they polish their basics.
        - Address them directly as "You".
        - Do NOT include any markdown, headers, or "Feedback:" prefixes. Just the text.
    `;

        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "text/plain"
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        let feedback = data.candidates?.[0]?.content?.parts?.[0]?.text || "No feedback generated.";

        return NextResponse.json({ feedback });

    } catch (error: any) {
        console.error("Feedback Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}