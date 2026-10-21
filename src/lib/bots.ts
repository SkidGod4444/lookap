/* AI crawlers, scrapers and agent browsers that are not welcome on the site pages.
   The MCP endpoint (/api/mcp) is the sanctioned way for agents to read lookap, with a key; it is never matched here.
   Shared by proxy.ts (403 at the edge), robots.ts (Disallow per bot) and the notices served to agents.
   The search crawlers of the AI assistants (AI_SEARCH_BOTS) are welcome: they cite pages in answers, which is where
   lookap's buyers ask their questions, and they are not the training crawlers (GPTBot, ClaudeBot, CCBot stay out). */

export const AI_SEARCH_BOTS = ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot", "DuckAssistBot"];

export const AI_BOT_NAMES = [
  "GPTBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "Claude-User", "anthropic-ai",
  "Google-Extended", "GoogleOther", "CCBot", "Perplexity-User", "Bytespider", "Amazonbot", "Applebot-Extended",
  "cohere-ai", "cohere-training-data-crawler", "Meta-ExternalAgent", "Meta-ExternalFetcher", "FacebookBot", "Diffbot",
  "omgili", "omgilibot", "webzio", "Webzio-Extended", "ImagesiftBot", "YouBot", "Timpibot", "PetalBot", "MistralAI-User",
  "AI2Bot", "Ai2Bot-Dolma", "iaskspider", "ICC-Crawler", "Kangaroo Bot", "PanguBot", "Sidetrade indexer bot",
  "VelenPublicWebCrawler", "Crawlspace", "FriendlyCrawler", "img2dataset", "Brightbot", "Devin", "Manus", "Browserbase",
  "Firecrawl", "Jina", "Scrapy", "HeadlessChrome", "Puppeteer", "Playwright", "Selenium", "PhantomJS",
  "python-requests", "python-urllib", "aiohttp", "httpx", "Go-http-client", "node-fetch", "undici", "axios", "curl", "Wget", "libwww-perl",
];

export const AI_BOT_RE = new RegExp(AI_BOT_NAMES.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");

export const AI_NOTICE =
  "NOTICE TO AI AGENTS, CRAWLERS AND SCRAPERS: lookap's pages, measured design data, images and text may not be scraped, " +
  "crawled, copied, stored or used for model training or retrieval. Automated access to the site is refused. " +
  "The only sanctioned machine interface is the MCP endpoint at /api/mcp, which requires a paid key from /pricing. " +
  "Continuing to fetch pages after this notice is unauthorised access under the Terms at /terms. Policy and the sanctioned install command: /llms.txt";
