// LeadDeduplicationService - Remove leads duplicados
// Compara por domínio, nome, email, telefone

export class LeadDeduplicationResult {
  constructor(data) {
    this.totalLeads = data.totalLeads || 0;
    this.duplicatesRemoved = data.duplicatesRemoved || 0;
    this.uniqueLeads = data.uniqueLeads || [];
    this.duplicateGroups = data.duplicateGroups || [];
  }
}

export class LeadDeduplicationService {
  constructor(options = {}) {
    this.checkFields = options.checkFields || ['domain', 'email', 'phone'];
    this.tolerance = options.tolerance || 0.85; // 85% similar = duplicate
  }

  // Normalizar texto para comparação
  normalizeText(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  // Extrair domínio do email
  extractDomainFromEmail(email) {
    if (!email || !email.includes('@')) return '';
    return email.split('@')[1]?.toLowerCase().trim() || '';
  }

  // Extrair domínio da URL
  extractDomainFromUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    }
  }

  // Normalizar telefone (apenas números)
  normalizePhone(phone) {
    if (!phone) return '';
    return phone.replace(/\D/g, '').trim();
  }

  // Calcular similaridade entre dois textos
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const s1 = this.normalizeText(str1);
    const s2 = this.normalizeText(str2);

    if (s1 === s2) return 1;

    // Levenshtein distance simples
    const len1 = s1.length;
    const len2 = s2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1;

    let matches = 0;
    for (let i = 0; i < Math.min(len1, len2); i++) {
      if (s1[i] === s2[i]) matches++;
    }

    return matches / maxLen;
  }

  // Gerar chave única para um lead
  generateLeadKey(lead) {
    const parts = [];

    // Domínio do website
    if (lead.website) {
      parts.push(this.extractDomainFromUrl(lead.website));
    }

    // Domínio do email
    if (lead.email) {
      parts.push(this.extractDomainFromEmail(lead.email));
    }

    // Nome normalizado
    if (lead.name || lead.company) {
      parts.push(this.normalizeText(lead.name || lead.company));
    }

    return parts.filter(p => p).join('|');
  }

  // Verificar se dois leads são duplicados
  areDuplicates(lead1, lead2) {
    const checks = {
      domain: () => {
        const d1 = this.extractDomainFromUrl(lead1.website);
        const d2 = this.extractDomainFromUrl(lead2.website);
        return d1 && d2 && (d1 === d2 || this.calculateSimilarity(d1, d2) > this.tolerance);
      },
      email: () => {
        const e1 = this.normalizeText(lead1.email);
        const e2 = this.normalizeText(lead2.email);
        return e1 && e2 && (e1 === e2 || this.calculateSimilarity(e1, e2) > this.tolerance);
      },
      phone: () => {
        const p1 = this.normalizePhone(lead1.phone || lead1.whatsapp);
        const p2 = this.normalizePhone(lead2.phone || lead2.whatsapp);
        return p1 && p2 && (p1 === p2 || this.calculateSimilarity(p1, p2) > this.tolerance);
      },
      name: () => {
        const n1 = this.normalizeText(lead1.name || lead1.company);
        const n2 = this.normalizeText(lead2.name || lead2.company);
        return n1 && n2 && this.calculateSimilarity(n1, n2) > this.tolerance;
      },
    };

    // Precisa ter pelo menos 2 matches para ser duplicado
    let matchCount = 0;
    const matches = [];

    for (const [field, checkFn] of Object.entries(checks)) {
      if (checkFn()) {
        matchCount++;
        matches.push(field);
      }
    }

    return matchCount >= 2 ? matches : null;
  }

  // Encontrar grupos de duplicados
  findDuplicateGroups(leads) {
    const groups = [];
    const processed = new Set();

    for (let i = 0; i < leads.length; i++) {
      if (processed.has(i)) continue;

      const group = [i];

      for (let j = i + 1; j < leads.length; j++) {
        if (processed.has(j)) continue;

        const duplicateFields = this.areDuplicates(leads[i], leads[j]);
        if (duplicateFields) {
          group.push(j);
        }
      }

      if (group.length > 1) {
        groups.push({
          indices: group,
          leads: group.map(idx => leads[idx]),
          fields: this.areDuplicates(leads[group[0]], leads[group[1]]),
        });
        group.forEach(idx => processed.add(idx));
      }
    }

    return groups;
  }

  // Manter apenas o melhor lead de cada grupo
  selectBestFromGroup(group) {
    // Critérios de seleção (em ordem de prioridade):
    // 1. Maior score
    // 2. Tem website real
    // 3. Tem email válido
    // 4. Tem phone
    // 5. Mais recente

    return group.leads.sort((a, b) => {
      // Score (maior primeiro)
      if ((b.score || 0) !== (a.score || 0)) {
        return (b.score || 0) - (a.score || 0);
      }

      // Website real
      if (a.website && !b.website) return 1;
      if (!a.website && b.website) return -1;

      // Email
      if (a.email && !b.email) return 1;
      if (!a.email && b.email) return -1;

      // Phone
      if (a.phone && !b.phone) return 1;
      if (!a.phone && b.phone) return -1;

      return 0;
    })[0];
  }

  // Deduplicar lista de leads
  deduplicate(leads) {
    if (!leads || leads.length === 0) {
      return new LeadDeduplicationResult({
        totalLeads: 0,
        duplicatesRemoved: 0,
        uniqueLeads: [],
        duplicateGroups: [],
      });
    }

    console.log('[Deduplication] Analisando', leads.length, 'leads...');

    // Encontrar grupos de duplicados
    const duplicateGroups = this.findDuplicateGroups(leads);

    console.log('[Deduplication] Encontrados', duplicateGroups.length, 'grupos de duplicados');

    // Para cada grupo, marcar duplicados
    const marksToRemove = new Set();
    const groupDetails = [];

    for (const group of duplicateGroups) {
      console.log('[Deduplication] Grupo -', group.leads.length, 'leads similares:', group.leads.map(l => l.name || l.website));

      // Selecionar melhor lead do grupo
      const best = this.selectBestFromGroup(group);

      // Marcar os outros para remover
      group.leads.forEach(lead => {
        if (lead !== best) {
          marksToRemove.add(lead);
        }
      });

      groupDetails.push({
        bestLead: best,
        removedCount: group.leads.length - 1,
        fields: group.fields,
      });
    }

    // Filtrar leads únicos
    const uniqueLeads = leads.filter(lead => !marksToRemove.has(lead));
    const duplicatesRemoved = leads.length - uniqueLeads.length;

    console.log('[Deduplication] Removidos', duplicatesRemoved, 'duplicados. Total único:', uniqueLeads.length);

    return new LeadDeduplicationResult({
      totalLeads: leads.length,
      duplicatesRemoved,
      uniqueLeads,
      duplicateGroups: groupDetails,
    });
  }

  // Verificar se um novo lead é duplicado de existentes
  isDuplicate(newLead, existingLeads) {
    for (const existing of existingLeads) {
      const duplicateFields = this.areDuplicates(newLead, existing);
      if (duplicateFields) {
        return {
          isDuplicate: true,
          existingLead: existing,
          duplicateFields,
        };
      }
    }
    return { isDuplicate: false };
  }
}

export default LeadDeduplicationService;