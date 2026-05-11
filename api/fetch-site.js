export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'pt-BR,pt;q=0.9,en;q=0.7',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      },
    });

    if (!response.ok) {
      return res.status(200).json({ emails: [], phones: [] });
    }

    const html = await response.text();

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