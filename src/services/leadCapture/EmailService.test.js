import test from 'node:test';
import assert from 'node:assert/strict';

import { EmailService } from './EmailService.js';

const lead = {
  name: 'DataFlow',
  website: 'https://dataflow.com.br',
  identifiedIssues: [
    { title: 'CTA pouco claro', description: 'O site nao conduz o visitante para contato.' },
    { title: 'Mobile', description: 'A experiencia mobile pode estar desalinhada.' },
  ],
};

test('renders visible signature before the email body when previewing', () => {
  const service = new EmailService();
  const html = service.generateEmailHtml(
    lead,
    'Olá, [Nome do lead capturado]\n\n[Pontos de melhoria]',
    { signatureSrc: '/Assinatura.png' }
  );

  assert.ok(html.indexOf('/Assinatura.png') < html.indexOf('Olá, DataFlow'));
  assert.match(html, /cta pouco claro/i);
  assert.match(html, /mobile/i);
});
