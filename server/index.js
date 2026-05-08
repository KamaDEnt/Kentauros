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

app.listen(port, () => {
  console.log(`Kentauros Email Server running on port ${port}`);
});
