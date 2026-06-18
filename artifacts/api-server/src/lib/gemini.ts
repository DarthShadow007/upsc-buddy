import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateQuestionsForSubject(subject: string, count: number, specificDifficulty?: string) {
  // THE FIX: If the subject is CSAT, force the count to a maximum of 3 so the AI doesn't choke on massive text.
  const safeCount = subject === "CSAT" ? Math.min(count, 3) : count;

  const schema = {
    type: SchemaType.ARRAY,
    description: `List of ${safeCount} UPSC Civil Services Exam questions for the subject: ${subject}.`,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        subject: { type: SchemaType.STRING },
        difficulty: { type: SchemaType.STRING, description: "'easy', 'medium', or 'hard'" },
        question: { type: SchemaType.STRING, description: "The MCQ text." },
        options: { 
            type: SchemaType.OBJECT, 
            properties: { A: { type: SchemaType.STRING }, B: { type: SchemaType.STRING }, C: { type: SchemaType.STRING }, D: { type: SchemaType.STRING } },
            required: ["A", "B", "C", "D"]
        },
        correctAnswer: { type: SchemaType.INTEGER, description: "Index of correct answer (1 for A, 2 for B, 3 for C, 4 for D)" },
        explanation: { type: SchemaType.STRING, description: "Detailed explanation." }
      },
      required: ["subject", "difficulty", "question", "options", "correctAnswer", "explanation"],
    },
  } as ResponseSchema; 

  let prompt = `Generate exactly ${safeCount} realistic, UPSC CSE Prelims level multiple-choice questions for the subject: "${subject}".`;
  
  if (specificDifficulty) {
    prompt += ` IMPORTANT: All generated questions MUST strictly be of "${specificDifficulty}" difficulty level.`;
  } else {
    prompt += ` Include a mixed variety of difficulty levels (easy, medium, hard).`;
  }

  // Strict text-length limits for CSAT
  if (subject === "CSAT") {
    prompt += ` CRITICAL: For reading comprehension, passages MUST be strictly under 100 words. Keep questions concise so the JSON response does not get cut off. Ensure the JSON array is properly closed.`;
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application/json", 
        responseSchema: schema,
        maxOutputTokens: 8192
      },
    });

    let rawText = result.response.text();
    rawText = rawText.split("```json").join("").split("```").join("").trim();

    return JSON.parse(rawText);
  } catch (error) {
    console.error(`Error generating questions for ${subject}:`, error);
    return []; 
  }
}