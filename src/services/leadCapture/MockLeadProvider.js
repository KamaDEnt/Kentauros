import { LeadSourceProvider } from './LeadSourceProvider';

export class MockLeadProvider extends LeadSourceProvider {
  constructor() {
    super('Mock Search Engine');
  }

  async search(query, options = {}) {
    const { quantity = 10 } = options;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const niche = query.niche || 'Consultoria';
    const location = query.location || 'Brasil';

    const companies = [
      'TechNova', 'Quantum Solutions', 'Nexus Consultoria', 'Horizon Group',
      'Apex Systems', 'Innovate Global', 'Stellar Partners', 'Prime Strategy',
      'Velocity Ventures', 'CloudBridge', 'DataFlow', 'Evolve IT'
    ];

    const results = [];
    for (let i = 0; i < quantity; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)] + ` ${i + 1}`;
      results.push({
        name: company,
        website: `https://www.${company.toLowerCase().replace(/ /g, '')}.com.br`,
        source: 'Google Maps',
        niche: niche,
        location: location
      });
    }

    return results;
  }

  async extractDetails(lead) {
    // Simulate deep scraping delay
    await new Promise(resolve => setTimeout(resolve, 50));

    const hasPhone = Math.random() > 0.3;
    const hasEmail = Math.random() > 0.4;
    const hasWhatsapp = Math.random() > 0.5;

    return {
      ...lead,
      phone: hasPhone ? `(11) 9${Math.floor(Math.random() * 90000000 + 10000000)}` : null,
      email: hasEmail ? `contato@${lead.website.split('www.')[1]}` : null,
      whatsapp: hasWhatsapp ? `(11) 9${Math.floor(Math.random() * 90000000 + 10000000)}` : null,
      completeness: (hasPhone ? 1 : 0) + (hasEmail ? 1 : 0) + (hasWhatsapp ? 1 : 0) + 1 // +1 for website/name
    };
  }
}
