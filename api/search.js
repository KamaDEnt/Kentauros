export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  try {
    const targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;

    // Try allorigins proxy first (most reliable for CORS)
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const response = await fetch(proxyUrl, {
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'pt-BR,pt;q=0.9,en;q=0.7',
        },
      });

      if (response.ok) {
        const html = await response.text();
        return res.status(200).json({ html, source: 'allorigins' });
      }
    } catch {}

    // Fallback to corsproxy.io
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const html = await response.text();
        return res.status(200).json({ html, source: 'corsproxy' });
      }
    } catch {}

    return res.status(503).json({ error: 'All proxies failed' });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}