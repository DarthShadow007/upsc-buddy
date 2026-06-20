import { Router } from "express";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cheerio from "cheerio";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.CA_KEY || "");

const TOPIC_MAP: Record<string, string> = {
  "All": "india news",
  "Governance & Polity": "governance OR polity OR government policy OR supreme court india",
  "Economy & Budget": "indian economy OR budget OR finance ministry OR rbi policy",
  "International Relations": "india foreign policy OR bilateral relations OR diplomacy",
  "Science & Technology": "science technology india OR isro OR drdo",
  "Environment": "environment india OR climate change policy OR pollution control",
  "Defense & Security": "india defense OR military sector OR national security",
  "President's Secretariat": "President of India",
  "NITI Aayog": "NITI Aayog policy",
  "Ministry of Finance": "Ministry of Finance India",
  "Ministry of Home Affairs": "Ministry of Home Affairs India",
  "Ministry of Defence": "Ministry of Defence India",
  "Ministry of Education": "Ministry of Education India",
  "Ministry of Health": "Ministry of Health and Family Welfare India",
  "Ministry of Agriculture": "Ministry of Agriculture India",
  "Sports News": "India Sports News"
};

async function fetchFullPageText(url: string): Promise<string> {
  try {
    const { data } = await axios.get(url, { 
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const $ = cheerio.load(data);
    $("script, style, nav, footer, header, iframe, ad").remove();
    const content = $("article").length ? $("article").text() : 
                    $(".story").length ? $(".story").text() : 
                    $(".content").length ? $(".content").text() : 
                    $("p").text();
    return content ? content.replace(/\s+/g, " ").trim().substring(0, 5000) : "";
  } catch (err) {
    return "";
  }
}

router.post("/fetch-news", async (req, res) => {
  const { topic } = req.query;
  const query = TOPIC_MAP[topic as string] || "india";
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key missing." });

  try {
    const newsResponse = await axios.get(`https://newsdata.io/api/1/latest`, {
      params: { apikey: apiKey, q: query, language: "en", country: "in" }
    });

    const articles = newsResponse.data.results || [];
    const processed = [];
    
    // Explicitly using the light/fast model as requested
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    for (const article of articles.slice(0, 3)) {
      try {
        const fullContent = await fetchFullPageText(article.link);
        const prompt = `
          You are a professional newspaper editor. Write a deep, insightful UPSC newspaper report.
          RULES:
          1. NO MCQs, NO quizzes, NO "Statement 1 correct".
          2. Use these headers exactly:
             ### NEWS BRIEF
             ### KEY POLICY INSIGHTS
             ### MAINS ANALYTICAL PERSPECTIVE
          3. Use **bolding** for critical terms.
          4. Text: ${article.title}. ${fullContent || article.description || ""}
        `;
        
        const result = await model.generateContent(prompt);
        processed.push({
          id: article.article_id || Math.random().toString(),
          title: article.title,
          date: new Date(article.pubDate).toLocaleDateString('en-GB'),
          summary: result.response.text(),
          imageUrl: article.image_url,
          sourceUrl: article.link
        });
      } catch (innerErr) {
        continue;
      }
    }
    res.json({ success: true, articles: processed });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;