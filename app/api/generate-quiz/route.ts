import { NextResponse } from "next/server";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function POST(req: Request) {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "API Key bulunamadı (.env.local kontrol edin)" }, { status: 500 });
        }

        const { topic, difficulty, numberOfQuestions } = await req.json();

        const prompt = `
        You are a quiz generator expert. Create ${numberOfQuestions} ${difficulty} difficulty multiple-choice questions about "${topic}".
        
        IMPORTANT REQUIREMENTS:
        1. Use VARIED question types.
        2. The correct answer should be RANDOMLY positioned (A, B, C, or D).
        3. Make wrong options plausible.
        
        Return ONLY valid JSON in this EXACT format (no markdown, no code blocks):
        {
          "questions": [
            {
              "questionText": "Question text here?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": "Option A",
              "points": 2
            }
          ]
        }
        
        RULES:
        - Exact string match for correctAnswer.
        - No markdown formatting (no \`\`\`json).
    `;

        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Hatası:", errorText);
            throw new Error(`Gemini API Hatası: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const firstBracket = text.indexOf("{");
        const lastBracket = text.lastIndexOf("}");
        if (firstBracket !== -1 && lastBracket !== -1) {
            text = text.substring(firstBracket, lastBracket + 1);
        }

        const parsedData = JSON.parse(text);

        const transformedQuestions = parsedData.questions.map((q: any, index: number) => {
            let correctIndex = q.options.indexOf(q.correctAnswer);
            if (correctIndex === -1) correctIndex = 0; // Hata toleransı

            return {
                id: Date.now() + index,
                question: q.questionText,
                options: q.options,
                correctAnswer: correctIndex,
            };
        });

        return NextResponse.json({ questions: transformedQuestions });

    } catch (error: any) {
        console.error("Quiz Oluşturma Hatası:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}