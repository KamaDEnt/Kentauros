export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    // Try allorigins proxy first
    let html = null;
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, {
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'pt-BR,pt;q=0.9,en;q=0.7',
        },
      });
      if (response.ok) {
        html = await response.text();
      }
    } catch {}

    // Fallback to corsproxy.io
    if (!html) {
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
          html = await response.text();
        }
      } catch {}
    }

    if (!html) {
      return res.status(200).json({ emails: [], phones: [] });
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = html.match(emailRegex) || [];
    const uniqueEmails = [...new Set(emails.filter(e => !/\.(png|jpe?g|webp|gif|svg)$/i.test(e)))];

    const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})/g;
    const phones = html.match(phoneRegex) || [];
    const uniquePhones = [...new Set(phones.map(p => p.replace(/\D/g, '')).filter(p => p.length >= 10 && p.length <= 11))];

    res.status(200).json({ emails: uniqueEmails, phones: uniquePhones });
  } catch (error) {
    console.error('Fetch site error:', error);
    res.status(200).json({ emails: [], phones: [] });
  }
}