// Serverless function for web search - Vercel compatible
// Uses Google Custom Search API (free tier: 100 searches/day)
// Get API key: https://developers.google.com/custom-search/v1/introduction

const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY || '';
const GOOGLE_CSE_ID = process.env.GOOGLE_SEARCH_CSE_ID || '';

const SEARCH_SOURCES = [
  // Google Custom Search (requires free API key)
  {
    name: 'google',
    enabled: Boolean(GOOGLE_API_KEY && GOOGLE_CSE_ID),
    search: async (query) => {
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&num=10`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Google API: ${res.status}`);
      const data = await res.json();
      return (data.items || []).map(item => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet || '',
      }));
    },
  },
  // DuckDuckGo via allorigins (no API key needed)
  {
    name: 'duckduckgo',
    enabled: true,
    search: async (query) => {
      const targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      ];
      for (const proxy of proxies) {
        try {
          const res = await fetch(proxy, {
            headers: { 'accept': 'text/html' },
          });
          if (res.ok) {
            const html = await res.text();
            const results = [];
            const linkRegex = /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
            let m;
            while ((m = linkRegex.exec(html)) !== null && results.length < 15) {
              const title = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              const href = m[1];
              if (href && title.length > 5 && !href.includes('duckduckgo') && !href.includes('wikipedia')) {
                results.push({ title, link: href, snippet: '' });
              }
            }
            if (results.length > 0) return results;
          }
        } catch {}
      }
      return [];
    },
  },
  // Bing Search via proxy (no API key)
  {
    name: 'bing',
    enabled: true,
    search: async (query) => {
      const targetUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      ];
      for (const proxy of proxies) {
        try {
          const res = await fetch(proxy, {
            headers: { 'accept': 'text/html', 'user-agent': 'Mozilla/5.0' },
          });
          if (res.ok) {
            const html = await res.text();
            const results = [];
            const liRegex = /<li[^>]*class="[^"]*b_algo[^"]*"[^>]*>[\s\S]*?<h2[^>]*>[\s\S]*?<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/li>/gi;
            let m;
            while ((m = liRegex.exec(html)) !== null && results.length < 10) {
              const title = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              if (title.length > 5) {
                results.push({ title, link: m[1], snippet: '' });
              }
            }
            if (results.length > 0) return results;
          }
        } catch {}
      }
      return [];
    },
  },
];

export default async function handler(req, res) {
  const { q, sources } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  const sourceList = sources ? sources.split(',') : ['duckduckgo', 'bing', 'google'];
  const allResults = [];

  for (const sourceName of sourceList) {
    const source = SEARCH_SOURCES.find(s => s.name === sourceName && s.enabled);
    if (!source) continue;

    try {
      const results = await source.search(q);
      allResults.push(...results.map(r => ({ ...r, source })));
    } catch (err) {
      console.error(`[search] ${sourceName} failed:`, err.message);
    }
  }

  // Remove duplicates by link
  const seen = new Set();
  const deduped = allResults.filter(r => {
    const domain = new URL(r.link).hostname.replace('www.', '');
    if (seen.has(domain)) return false;
    seen.add(domain);
    return true;
  });

  res.status(200).json({
    query: q,
    count: deduped.length,
    results: deduped,
    sources: sourceList.filter(s => SEARCH_SOURCES.find(src => src.name === s)?.enabled),
  });
}