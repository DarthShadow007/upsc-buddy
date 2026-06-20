import * as https from "https";
import * as http from "http";

// ── Ministry to RSS RegId mapping ────────────────────────────────────────
// PIB RSS feeds are region-based (RegId) not ministry-based
// We fetch all releases and filter by ministry keyword in the title/description
const MINISTRY_KEYWORDS: Record<string, string[]> = {
  "All Ministries":              [],
  "PMO":                         ["prime minister", "pmo", "cabinet"],
  "Ministry of Finance":         ["finance", "budget", "tax", "gst", "revenue", "rbi", "sebi"],
  "Ministry of Home Affairs":    ["home affairs", "mha", "police", "security", "border", "nrc"],
  "Ministry of Defence":         ["defence", "military", "army", "navy", "air force", "drdo"],
  "Ministry of External Affairs":["external affairs", "mea", "foreign", "embassy", "bilateral"],
  "Ministry of Education":       ["education", "university", "school", "ugc", "aicte", "nep"],
  "Ministry of Health":          ["health", "aiims", "hospital", "medicine", "covid", "vaccine"],
  "Ministry of Agriculture":     ["agriculture", "farmer", "crop", "msp", "rural", "food"],
  "Ministry of Environment":     ["environment", "forest", "climate", "wildlife", "pollution"],
  "Ministry of Commerce":        ["commerce", "trade", "export", "import", "wto", "industry"],
  "Ministry of Railways":        ["railway", "train", "station", "metro", "infrastructure"],
  "Ministry of Science":         ["science", "technology", "isro", "research", "innovation"],
  "Ministry of Law":             ["law", "justice", "court", "legal", "judiciary"],
  "Ministry of Women":           ["women", "child", "gender", "maternal"],
  "Ministry of Tribal Affairs":  ["tribal", "adivasi", "schedule tribe"],
  "NITI Aayog":                  ["niti aayog", "think tank", "policy"],
};

export interface PIBArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  ministry: string;
}

// ── Fetch RSS XML from PIB ────────────────────────────────────────────────
function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UPSC-Buddy/1.0)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    }, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (location) return fetchUrl(location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }

      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// ── Parse RSS XML into articles ───────────────────────────────────────────
function parseRSS(xml: string): PIBArticle[] {
  const articles: PIBArticle[] = [];

  // Extract all <item> blocks
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const item of itemMatches) {
    const title = extractTag(item, "title");
    const description = extractTag(item, "description");
    const link = extractTag(item, "link");
    const pubDate = extractTag(item, "pubDate");

    if (!title) continue;

    // Extract ministry from description or title
    const ministry = inferMinistry(title + " " + description);

    articles.push({
      title: cleanText(title),
      description: cleanText(description),
      link: link || "",
      pubDate: pubDate || new Date().toISOString(),
      ministry,
    });
  }

  return articles;
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i"))
    || xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferMinistry(text: string): string {
  const lower = text.toLowerCase();
  for (const [ministry, keywords] of Object.entries(MINISTRY_KEYWORDS)) {
    if (ministry === "All Ministries") continue;
    if (keywords.some((kw) => lower.includes(kw))) return ministry;
  }
  return "Government of India";
}

// ── Filter articles by date ───────────────────────────────────────────────
function filterByDate(articles: PIBArticle[], dateStr: string): PIBArticle[] {
  if (!dateStr) return articles;

  // dateStr expected as YYYY-MM-DD
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  return articles.filter((a) => {
    const articleDate = new Date(a.pubDate);
    return articleDate >= targetDate && articleDate < nextDay;
  });
}

// ── Filter articles by ministry ───────────────────────────────────────────
function filterByMinistry(articles: PIBArticle[], ministry: string): PIBArticle[] {
  if (!ministry || ministry === "All Ministries") return articles;

  const keywords = MINISTRY_KEYWORDS[ministry] || [];
  if (keywords.length === 0) return articles;

  return articles.filter((a) => {
    const text = (a.title + " " + a.description).toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });
}

// ── Main export: scrape PIB articles ─────────────────────────────────────
export async function scrapePIBArticles(
  ministry: string,
  date: string
): Promise<PIBArticle[]> {
  try {
    // PIB RSS feed — works reliably, no VIEWSTATE needed
    const rssUrl = "https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3";

    console.log(`Fetching PIB RSS for ministry: ${ministry}, date: ${date}`);
    const xml = await fetchUrl(rssUrl);

    if (!xml || xml.length < 100) {
      throw new Error("Empty RSS response from PIB");
    }

    // Parse all articles from RSS
    let articles = parseRSS(xml);
    console.log(`Parsed ${articles.length} articles from PIB RSS`);

    // Filter by date if provided
    if (date) {
      articles = filterByDate(articles, date);
      console.log(`After date filter (${date}): ${articles.length} articles`);
    }

    // Filter by ministry if provided
    if (ministry && ministry !== "All Ministries") {
      const ministryFiltered = filterByMinistry(articles, ministry);
      // If ministry filter gives 0 results, return all date-filtered articles
      // (better UX than empty state when ministry names don't exactly match)
      articles = ministryFiltered.length > 0 ? ministryFiltered : articles;
      console.log(`After ministry filter (${ministry}): ${articles.length} articles`);
    }

    // Return max 10 articles to avoid overwhelming Gemini
    return articles.slice(0, 10);

  } catch (error) {
    console.error("PIB RSS fetch failed:", error);
    // Fallback: try the alternate RSS endpoint
    try {
      const fallbackUrl = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1";
      const xml = await fetchUrl(fallbackUrl);
      const articles = parseRSS(xml);
      return articles.slice(0, 5);
    } catch {
      return [];
    }
  }
}

// Export ministry list for frontend dropdown
export const MINISTRY_LIST = Object.keys(MINISTRY_KEYWORDS);