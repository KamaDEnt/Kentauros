import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { captureLeads } from './leadCaptureEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;
const GMAIL_MIN_INTERVAL_MS = Number(process.env.GMAIL_MIN_INTERVAL_MS || 12000);
let nextAvailableSendAt = Date.now();

app.use(cors());
app.use(express.json());

app.get('/api/system-health', (req, res) => {
  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    services: {
      email: {
        configured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
        minIntervalMs: GMAIL_MIN_INTERVAL_MS,
      },
      capture: {
        bingApiConfigured: Boolean(process.env.BING_SEARCH_API_KEY),
        googlePlacesConfigured: Boolean(process.env.GOOGLE_PLACES_API_KEY),
        fallbackSearchEnabled: true,
      },
    },
  });
});

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const waitForGmailSlot = async () => {
  const now = Date.now();
  const scheduledAt = Math.max(now, nextAvailableSendAt);
  nextAvailableSendAt = scheduledAt + GMAIL_MIN_INTERVAL_MS;

  if (scheduledAt > now) {
    await wait(scheduledAt - now);
  }
};

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/send-email', async (req, res) => {
  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await waitForGmailSlot();

    const info = await transporter.sendMail({
      from: `"Kentauros Consulting" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: 'Assinatura.png',
          path: path.resolve(__dirname, '../public/Assinatura.png'),
          cid: 'assinatura' // same cid value as in the html img src
        }
      ]
    });

    console.log('Message sent: %s', info.messageId);
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/capture-leads', async (req, res) => {
  const config = req.body || {};

  if (!config.niche || !config.location || !config.quantity) {
    return res.status(400).json({ error: 'Missing required capture fields' });
  }

  try {
    const leads = await captureLeads(config);
    const requested = Number(config.quantity);
    res.status(200).json({
      success: true,
      requested,
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error('Error capturing leads:', error);
    res.status(500).json({ error: 'Failed to capture leads' });
  }
});

app.get('/api/search', async (req, res) => {
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
      const response = await fetch(proxy.url, {
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'pt-BR,pt;q=0.9,en;q=0.7',
        },
      });
      if (response.ok) {
        const html = await response.text();
        if (html && html.length > 100) {
          return res.status(200).json({ html, source: proxy.name });
        }
      }
    } catch {}
  }

  return res.status(503).json({ error: 'All proxies failed' });
});

app.get('/api/fetch-site', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  let html = null;
  for (const proxy of proxies) {
    try {
      const response = await fetch(proxy);
      if (response.ok) {
        html = await response.text();
        break;
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
});

app.listen(port, () => {
  console.log(`Kentauros Email Server running on port ${port}`);
});
