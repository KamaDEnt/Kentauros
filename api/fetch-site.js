// Serverless function for fetching site content and extracting contacts
const BLOCKED_DOMAINS = [
  'google.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com',
  'twitter.com', 'wikipedia.org', 'github.com', 'stackoverflow.com',
];

const PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

const fetchViaProxy = async (url) => {
  for (const proxyFn of PROXIES) {
    try {
      const res = await fetch(proxyFn(url), {
        signal: AbortSignal.timeout(12000),
        headers: { 'accept': 'text/html,application/xhtml+xml' },
      });
      if (res.ok) {
        const text = await res.text();
        if (text.length > 200) return text;
      }
    } catch {}
  }
  return null;
};

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    if (BLOCKED_DOMAINS.some(d => hostname.includes(d))) {
      return res.status(200).json({ emails: [], phones: [], error: 'blocked' });
    }

    const html = await fetchViaProxy(url);
    if (!html) {
      return res.status(200).json({ emails: [], phones: [], error: 'fetch_failed' });
    }

    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const emails = html.match(emailRegex) || [];
    const uniqueEmails = [...new Set(
      emails.filter(e => !/\.(png|jpg|jpeg|webp|gif|svg|ico)$/i.test(e))
    )].slice(0, 5);

    // Extract Brazilian phone numbers
    const phoneRegex = /(?:\+?55)?[\s.-]?(?:\(?\d{2}\)?)[\s.-]?9\d{4}[\s.-]?\d{4}/g;
    const phonesRaw = html.match(phoneRegex) || [];
    const phones = [...new Set(phonesRaw.map(p => p.replace(/\D/g, '')).filter(p => p.length >= 10 && p.length <= 13))].slice(0, 5);

    // Extract meta info
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'/]/i);
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'/]/i);

    res.status(200).json({
      emails,
      phones,
      meta: {
        title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '',
        description: descriptionMatch ? descriptionMatch[1] : '',
        ogTitle: ogTitleMatch ? ogTitleMatch[1] : '',
      },
    });
  } catch (error) {
    console.error('[fetch-site] Error:', error.message);
    res.status(200).json({ emails: [], phones: [], error: error.message });
  }
}