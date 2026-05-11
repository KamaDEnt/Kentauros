export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  const targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  const proxies = [
    { name: 'allorigins', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}` },
    { name: 'corsproxy', url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` },
    { name: 'thingproxy', url: `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(targetUrl)}` },
  ];

  for (const proxy of proxies) {
    try {
      console.log(`[search] Trying proxy: ${proxy.name}`);
      const response = await fetch(proxy.url, {
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'pt-BR,pt;q=0.9,en;q=0.7',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (response.ok) {
        const html = await response.text();
        if (html && html.length > 100) {
          console.log(`[search] Success via ${proxy.name}, html length: ${html.length}`);
          return res.status(200).json({ html, source: proxy.name });
        }
      }
      console.log(`[search] Proxy ${proxy.name} failed: ${response.status}`);
    } catch (err) {
      console.error(`[search] Proxy ${proxy.name} error:`, err.message);
    }
  }

  console.error('[search] All proxies failed');
  return res.status(503).json({ error: 'All proxies failed', target: targetUrl });
}