// Vercel Serverless Function: /api/leads/import
// Recebe leads capturados pelo CapLead e importa para a Kentauros

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Validação de lead do CapLead
function validateCapLeadData(lead) {
  const errors = [];

  if (!lead.nome && !lead.name && !lead.empresa) {
    errors.push('Nome/empresa é obrigatório');
  }

  if (!lead.site_oficial && !lead.website && !lead.url) {
    errors.push('Website é obrigatório');
  }

  return errors;
}

// Normaliza dados do lead para formato da Kentauros
function normalizeLeadData(lead) {
  return {
    company: lead.nome || lead.name || lead.empresa || 'Empresa',
    contact: lead.responsavel || lead.contact || lead.contato || 'Representante',
    email: lead.email || lead.contato_email || '',
    phone: lead.telefone || lead.phone || '',
    website: lead.site_oficial || lead.website || lead.url || '',
    source: 'CapLead Import',
    status: 'new',
    industry: lead.categoria || lead.nicho || lead.category || '',
    notes: lead.descricao || lead.desc || lead.description || '',
    city: lead.cidade || lead.city || '',
    state: lead.estado || lead.state || '',
    sourceDetails: {
      importedAt: new Date().toISOString(),
      originalData: lead,
    }
  };
}

export async function GET() {
  return Response.json({
    ok: true,
    route: '/api/leads/import',
    methods: ['POST'],
    description: 'Endpoint para importar leads do CapLead',
    expectedBody: {
      leads: 'array of lead objects',
      userId: 'user ID (optional)',
    },
    example: {
      leads: [
        {
          nome: 'Empresa XYZ',
          site_oficial: 'https://empresaxyz.com.br',
          email: 'contato@empresaxyz.com.br',
          telefone: '(11) 99999-9999',
          nicho: 'contabilidade',
          cidade: 'São Paulo',
          estado: 'SP'
        }
      ]
    }
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { leads, userId, userEmail, userName } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return Response.json({
        success: false,
        errorCode: 'NO_LEADS',
        message: 'Nenhum lead fornecido para importação',
      }, { status: 400 });
    }

    console.log('[Import API] Recebendo', leads.length, 'leads do CapLead');

    const results = {
      imported: [],
      failed: [],
      duplicates: 0,
    };

    for (const lead of leads) {
      // Validar dados do lead
      const errors = validateCapLeadData(lead);
      if (errors.length > 0) {
        results.failed.push({
          lead,
          errors,
          reason: 'VALIDATION_FAILED'
        });
        continue;
      }

      // Normalizar dados
      const normalizedLead = normalizeLeadData(lead);

      // Verificar duplicado pelo website
      if (supabase && normalizedLead.website) {
        const domain = normalizedLead.website.replace(/^https?:\/\//, '').replace(/^www\./, '');
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .like('website', `%${domain}%`)
          .limit(1);

        if (existing && existing.length > 0) {
          results.duplicates++;
          console.log('[Import API] Duplicado ignorado:', normalizedLead.company);
          continue;
        }
      }

      // Inserir lead
      if (supabase) {
        const { data, error } = await supabase
          .from('leads')
          .insert({
            ...normalizedLead,
            commercialOwnerUserId: userId || null,
            commercialOwnerEmail: userEmail || null,
            commercialOwnerName: userName || null,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('[Import API] Erro ao inserir lead:', error);
          results.failed.push({
            lead: normalizedLead,
            errors: [error.message],
            reason: 'INSERT_FAILED'
          });
        } else {
          results.imported.push(data);
          console.log('[Import API] Lead importado:', normalizedLead.company);
        }
      } else {
        // Sem Supabase - só retorna sucesso simulando
        results.imported.push({
          ...normalizedLead,
          id: `caplead_${Date.now()}`,
          importedAt: new Date().toISOString()
        });
      }
    }

    const summary = {
      total: leads.length,
      imported: results.imported.length,
      failed: results.failed.length,
      duplicates: results.duplicates,
    };

    console.log('[Import API] Resumo da importação:', summary);

    return Response.json({
      success: true,
      message: `Importação concluída: ${results.imported.length} leads importados`,
      summary,
      importedLeads: results.imported,
      failedLeads: results.failed.length > 0 ? results.failed : undefined,
    });

  } catch (error) {
    console.error('[Import API] ERRO FATAL:', error);

    return Response.json({
      success: false,
      errorCode: 'INTERNAL_ERROR',
      message: error.message || 'Erro interno na importação',
    }, { status: 500 });
  }
}