import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const GS_QUESTION_TYPE_PROMPTS: Record<string, string> = {

  direct_mcq: `Generate a DIRECT FACT-BASED MCQ in the style of UPSC Prelims.
Example format:
"With reference to [topic], which of the following statements is correct?"
(a) Option A
(b) Option B  
(c) Option C
(d) Option D
The question must test conceptual clarity, NOT just memorization. Difficulty: the 2023 UPSC cutoff was 75/200 — make it genuinely challenging.`,

  multi_statement: `Generate a MULTI-STATEMENT question in exact UPSC Prelims style.
Example format:
"Consider the following statements regarding [topic]:
1. [Statement one — may be true or false]
2. [Statement two — may be true or false]
3. [Statement three — may be true or false]
Which of the statements given above is/are correct?
(a) 1 only
(b) 1 and 2 only
(c) 2 and 3 only
(d) 1, 2 and 3"
IMPORTANT: Statements should be tricky — some partially true, some subtly wrong. Avoid making all statements obviously correct or wrong.`,

  assertion_reason: `Generate an ASSERTION-REASON question in exact UPSC Prelims style.
Example format:
"Statement-I: [An assertion about a fact or event]
Statement-II: [A reason or explanation related to Statement-I]
Which one of the following is correct in respect of the above statements?
(a) Both Statement-I and Statement-II are correct and Statement-II explains Statement-I
(b) Both Statement-I and Statement-II are correct but Statement-II does not explain Statement-I
(c) Statement-I is correct but Statement-II is incorrect
(d) Statement-I is incorrect but Statement-II is correct"
IMPORTANT: The relationship between the two statements must be subtle and non-obvious. Avoid trivial or obvious pairs.`,

  match_following: `Generate a MATCH THE FOLLOWING question in exact UPSC Prelims style.
Example format:
"Consider the following pairs:
List-I (Term/Person/Place)     List-II (Description/Associated with)
1. [Item A]                    (i) [Description A]
2. [Item B]                    (ii) [Description B]
3. [Item C]                    (iii) [Description C]
4. [Item D]                    (iv) [Description D]
How many of the above pairs are correctly matched?
(a) Only one pair
(b) Only two pairs
(c) Only three pairs
(d) All four pairs"
IMPORTANT: Mix correct and incorrect pairs. Test deep knowledge of associations.`,

  chronological: `Generate a CHRONOLOGICAL ORDER question in exact UPSC Prelims style.
Example format:
"Consider the following events/acts/developments:
1. [Event/Act A]
2. [Event/Act B]
3. [Event/Act C]
4. [Event/Act D]
What is the correct chronological order of the above?
(a) 1-2-3-4
(b) 2-1-4-3
(c) 3-1-2-4
(d) 4-3-2-1"
IMPORTANT: Choose events where the order is genuinely confusing and requires precise knowledge.`,

  how_many_correct: `Generate a HOW-MANY-STATEMENTS-CORRECT question in exact UPSC 2023-2025 style.
This is the most common format in recent UPSC papers.
Example format:
"With reference to [topic], consider the following statements:
1. [Statement]
2. [Statement]
3. [Statement]
How many of the above statements are correct?
(a) Only one
(b) Only two
(c) All three
(d) None"
IMPORTANT: This format replaced simple 'which is correct' questions in recent UPSC papers. Make statements nuanced.`,
};

const CSAT_QUESTION_TYPE_PROMPTS: Record<string, string> = {

  comprehension: `Generate a READING COMPREHENSION set in exact UPSC CSAT style.
Format: One passage (STRICTLY under 80 words) followed by ONE question.
The passage should be on: governance, social issues, economy, or science.
The question should test inference and understanding, NOT direct recall.
Example question types:
- "Which of the following can be inferred from the above passage?"
- "The author's main argument in the passage is:"
- "Which of the following best summarizes the passage?"
Options must be close to each other — avoid obviously wrong options.`,

  logical_reasoning: `Generate a LOGICAL REASONING question in exact UPSC CSAT style.
Types to use (pick one):
- Syllogism: "All A are B. Some B are C. Which conclusion follows?"
- Blood Relations: "[Person] is [relation] of [Person]. How is X related to Y?"
- Series completion: "Find the next term: 2, 5, 10, 17, 26, ?"
- Coding-Decoding: "If DELHI is coded as EHMIJ, how is MUMBAI coded?"
- Direction sense: "[Person] walks [direction], then turns [direction]..."
Difficulty: Moderate to Hard (CSAT 2023-2025 level).`,

  quantitative: `Generate a QUANTITATIVE APTITUDE question in exact UPSC CSAT / CAT level style.
Topics to use (pick one):
- Percentage: "A price increased by X%, then decreased by Y%..."
- Time and Work: "A can do work in X days, B in Y days..."
- Time, Speed, Distance: "A train crosses a platform in..."
- Simple/Compound Interest: "A sum doubles in X years at SI..."
- Ratio and Proportion: "Ratio of A:B is X:Y..."
- Data Interpretation: Provide a small table/data and ask a calculation question
- Profit and Loss: "A shopkeeper marks up by X% and gives Y% discount..."
IMPORTANT: Numbers must be non-trivial. Show clear calculation in explanation.`,

  data_interpretation: `Generate a DATA INTERPRETATION question in exact UPSC CSAT style.
Format: Provide a small 2x3 or 3x3 table with numerical data, then ask ONE calculation question.
Example: A table showing production data for 3 years across 2 categories.
Question types:
- "What is the percentage increase from Year X to Year Y?"
- "Which year showed the highest growth rate?"
- "What is the ratio of A to B in Year X?"
The data should be realistic (budget figures, population data, export-import figures).`,
};

export async function generateQuestionsForSubject(
  subject: string,
  count: number,
  specificDifficulty?: string,
  questionTypes?: string[]
): Promise<any[]> {

  const isCSAT = subject === "CSAT";

  const safeCount = isCSAT ? Math.min(count, 3) : Math.min(count, 5);

  const typePool = isCSAT
    ? Object.keys(CSAT_QUESTION_TYPE_PROMPTS)
    : Object.keys(GS_QUESTION_TYPE_PROMPTS);

  const selectedTypes = questionTypes || typePool;

  const systemContext = isCSAT
    ? `You are an expert UPSC CSAT (Paper II) question setter. 
UPSC CSAT tests: Reading Comprehension (30%), Logical Reasoning (25%), Quantitative Aptitude (25%), Data Interpretation (20%).
CSAT is qualifying at 33% (66.67/200). Questions are moderate difficulty.
Each question carries 2.5 marks. Wrong answer: -0.83 marks (1/3 negative marking).
Generate questions that are original and NOT copied from any previous UPSC paper.`
    : `You are an expert UPSC Civil Services Preliminary Examination (GS Paper I) question setter.
Based on UPSC Prelims 2019-2025 analysis:
- The 2023 cutoff was just 75.41/200 — one of the hardest papers ever
- 47% questions are multi-statement type requiring "how many statements are correct"
- 18% are Assertion-Reason (Statement I and Statement II format)  
- 10% are Match the Following
- Questions test conceptual clarity + current affairs linkage + analytical ability
- Subject: ${subject} typically has these many questions: Polity(15-20), Economy(12-18), Environment(14-18), History(12-15), Geography(10-14), Science(8-12), Art & Culture(4-6)
Each question carries 2 marks. Wrong answer: -0.67 marks (1/3 negative marking).
Generate ORIGINAL questions inspired by UPSC style. Do NOT reproduce any actual UPSC question verbatim.`;

  const typeInstructions = selectedTypes
    .slice(0, safeCount)
    .map((t, i) => {
      const pool = isCSAT ? CSAT_QUESTION_TYPE_PROMPTS : GS_QUESTION_TYPE_PROMPTS;
      return pool[t] || pool[Object.keys(pool)[i % Object.keys(pool).length]];
    });

  const schema = {
    type: SchemaType.ARRAY,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        subject: { type: SchemaType.STRING },
        difficulty: {
          type: SchemaType.STRING,
          description: "easy, medium, or hard",
        },
        questionType: {
          type: SchemaType.STRING,
          description: "direct_mcq, multi_statement, assertion_reason, match_following, chronological, how_many_correct, comprehension, logical_reasoning, quantitative, data_interpretation",
        },
        question: {
          type: SchemaType.STRING,
          description: "Full question text including any statements, passage, or data table. Use numbered lists for statements.",
        },
        options: {
          type: SchemaType.OBJECT,
          properties: {
            A: { type: SchemaType.STRING },
            B: { type: SchemaType.STRING },
            C: { type: SchemaType.STRING },
            D: { type: SchemaType.STRING },
          },
          required: ["A", "B", "C", "D"],
        },
        correctAnswer: {
          type: SchemaType.INTEGER,
          description: "0 for A, 1 for B, 2 for C, 3 for D",
        },
        explanation: {
          type: SchemaType.STRING,
          description: "Detailed explanation with factual backing. For multi-statement questions, explain why each statement is correct/incorrect.",
        },
      },
      required: ["subject", "difficulty", "questionType", "question", "options", "correctAnswer", "explanation"],
    },
  } as ResponseSchema;

  const difficultyInstruction = specificDifficulty
    ? `All questions MUST be "${specificDifficulty}" difficulty.`
    : isCSAT
    ? `Mix: 40% easy, 40% medium, 20% hard.`
    : `Mix: 20% easy, 50% medium, 30% hard. Remember the 2023 cutoff was just 75/200.`;

  const prompt = `${systemContext}

Generate exactly ${safeCount} questions for subject: "${subject}".
${difficultyInstruction}

Question type instructions for this batch:
${typeInstructions.map((inst, i) => `Question ${i + 1}: ${inst}`).join("\n\n")}

STRICT RULES:
1. Do NOT copy or reproduce any actual UPSC question from previous papers
2. Generate ORIGINAL questions inspired by UPSC style and difficulty
3. Options must be plausible — avoid obviously wrong options
4. correctAnswer is 0-indexed: 0=A, 1=B, 2=C, 3=D
5. Explanation must justify why the correct answer is right AND why others are wrong
6. For ${subject}: use accurate, verifiable facts only
7. Return valid JSON array only — no markdown, no extra text`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        maxOutputTokens: 8192,
        temperature: 0.7, 
      },
    });

    let rawText = result.response.text();
    rawText = rawText
      .split("```json").join("")
      .split("```").join("")
      .trim();

    const parsed = JSON.parse(rawText);

    return parsed.map((q: any) => ({
      ...q,
      options: Array.isArray(q.options)
        ? q.options
        : [q.options.A || "", q.options.B || "", q.options.C || "", q.options.D || ""],
      correctAnswer: typeof q.correctAnswer === "number"
        ? q.correctAnswer >= 1 && q.correctAnswer <= 4
          ? q.correctAnswer - 1  
          : Math.min(q.correctAnswer, 3)  
        : 0,
      questionType: q.questionType || "direct_mcq",
    }));

  } catch (error) {
    console.error(`Gemini error for ${subject}:`, error);
    return [];
  }
}

export async function generateMockTestChunk(
  subject: string,
  count: number,
  isCSAT: boolean
): Promise<any[]> {
  const results: any[] = [];
  const chunkSize = isCSAT ? 3 : 5;
  const chunks = Math.ceil(count / chunkSize);

  const gsTypes = [
    "how_many_correct",   
    "assertion_reason",   
    "multi_statement",    
    "match_following",    
    "direct_mcq",         
    "chronological",      
  ];

  const csatTypes = [
    "comprehension",
    "logical_reasoning",
    "quantitative",
    "data_interpretation",
  ];

  const typePool = isCSAT ? csatTypes : gsTypes;

  const batchSize = 3;
  for (let i = 0; i < chunks; i += batchSize) {
    const batch = Array.from(
      { length: Math.min(batchSize, chunks - i) },
      (_, j) => {
        const typeIndex = (i + j) % typePool.length;
        const types = [typePool[typeIndex]];
        const thisCount = Math.min(chunkSize, count - (i + j) * chunkSize);
        return thisCount > 0
          ? generateQuestionsForSubject(subject, thisCount, undefined, types)
          : Promise.resolve([]);
      }
    );

    const batchResults = await Promise.all(batch);
    for (const r of batchResults) results.push(...r);

    if (i + batchSize < chunks) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return results.slice(0, count);
}