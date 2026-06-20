import { Router } from "express";
import axios from "axios";
import { generateQuestionsForSubject } from "../lib/gemini";

const router = Router();

router.post("/fetch", async (req, res) => {
  const { topic } = req.query;
  const apiKey = process.env.NEWSDATA_API_KEY;

  try {
    const newsResponse = await axios.get(`https://newsdata.io/api/1/latest`, {
      params: { apikey: apiKey, q: topic || "india", language: "en", country: "in" }
    });

    const articles = newsResponse.data.results || [];
    const processed = [];

    for (const article of articles.slice(0, 3)) {
      const prompt = `
        You are an expert UPSC professor. Write a deep, insightful newspaper report.
        DO NOT include any quiz questions, MCQs, or statement-based logic.
        Structure your response with these exact headers:
        
        ### Context & Background
        [Deep academic explanation]
        ### Key Facts & Policy Parameters
        [Detailed bullet points with data]
        ### UPSC Mains Analytical Perspective
        [Critical Mains-style analysis]
        
        Article: ${article.title}. ${article.description}
      `;

      const aiResponse = await generateQuestionsForSubject(prompt, 1, "hard", ["direct_mcq"], "ca");
      processed.push({
        id: article.article_id,
        title: article.title,
        date: article.pubDate,
        summary: aiResponse[0]?.explanation || "Analysis failed.",
        imageUrl: article.image_url,
        sourceUrl: article.link
      });
    }
    res.json({ articles: processed });
  } catch (e) {
    res.status(500).json({ error: "Failed news fetch." });
  }
});

export default router;