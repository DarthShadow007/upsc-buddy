import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateQuestionsForSubject(subject: string, count: number, specificDifficulty?: string) {
  const schema = {
    type: SchemaType.ARRAY,
    description: `List of ${count} UPSC Civil Services Exam questions for the subject: ${subject}.`,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        subject: { type: SchemaType.STRING },
        difficulty: { type: SchemaType.STRING, description: "'easy', 'medium', or 'hard'" },
        question: { type: SchemaType.STRING, description: "The MCQ text. For CSAT, include the passage if necessary." },
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

  let prompt = `Generate exactly ${count} realistic, UPSC CSE Prelims level multiple-choice questions for the subject: "${subject}".`;
  
  if (specificDifficulty) {
    prompt += ` IMPORTANT: All generated questions MUST strictly be of "${specificDifficulty}" difficulty level.`;
  } else {
    prompt += ` Include a mixed variety of difficulty levels (easy, medium, hard).`;
  }

  if (subject === "CSAT") {
    prompt += ` Keep reading comprehension passages relatively short to prevent text cutoff.`;
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
    // Safely remove markdown formatting using string replacement instead of regex
    rawText = rawText.split("```json").join("").split("```").join("").trim();

    return JSON.parse(rawText);
  } catch (error) {
    console.error(`Error generating questions for ${subject}:`, error);
    return []; 
  }
}