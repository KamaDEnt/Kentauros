import { formatIssuesAsHtmlList } from './leadCaptureInsights.js';

export class EmailService {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async sendEmail(to, subject, html) {
    try {
      const response = await fetch(`${this.baseUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, html }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('EmailService Error:', error);
      throw error;
    }
  }

  generateEmailHtml(lead, templateBody, options = {}) {
    const signatureSrc = options.signatureSrc || 'cid:assinatura';
    const improvementPoints = formatIssuesAsHtmlList(lead.identifiedIssues || lead.issues || []);

    let html = templateBody
      .replace(/\[Nome do cliente capturado\]/g, lead.name || 'Cliente')
      .replace(/\[Nome do lead capturado\]/g, lead.name || 'Cliente')
      .replace(/\[Nome do lead\]/g, lead.name || 'Cliente')
      .replace(/\[Problema encontrado\]/g, lead.identifiedIssues?.[0]?.title || 'oportunidade de melhorar a conversão')
      .replace(/\[Problema encontrado que mais se destaca no processo de captura do lead\]/g, lead.identifiedIssues?.[0]?.title || 'oportunidade de melhorar a conversão')
      .replace(/\[Pontos de melhoria\]/g, improvementPoints)
      .replace(/\[Site capturado\]/g, lead.website || 'seu site');

    html = html.replace(/\n/g, '<br/>');

    return `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.55;">
        <div style="margin-bottom: 18px;">
          <img src="${signatureSrc}" alt="Assinatura Kentauros" style="display: block; max-width: 260px; width: 100%; height: auto;" />
        </div>
        <div>${html}</div>
      </div>
    `;
  }
}

export const emailService = new EmailService();
