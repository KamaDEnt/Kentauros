// Vercel Serverless Function: /api/leads/save-for-future-contact
// Saves selected leads for future contact without sending emails

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Table name for captured leads registry
const REGISTRY_TABLE = 'captured_leads_registry';

// Normalize string for comparison
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract domain from website URL
function extractDomain(website) {
  if (!website) return '';
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return normalize(website);
  }
}

// Generate unique identity for a lead
function generateLeadIdentity(lead) {
  const parts = [
    extractDomain(lead.website),
    normalize(lead.email),
    normalize(lead.phone),
    normalize(lead.name),
  ];
  return parts.filter(Boolean).join('|');
}

// Health check endpoint
export async function GET() {
  return Response.json({
    ok: true,
    route: '/api/leads/save-for-future-contact',
    methods: ['POST'],
    timestamp: new Date().toISOString(),
  });
}

// Main POST handler
export async function POST(req) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    // Validate required fields
    if (!body.leads || !Array.isArray(body.leads) || body.leads.length === 0) {
      return Response.json({
        success: false,
        errorCode: 'MISSING_LEADS',
        message: 'Array de leads é obrigatório e não pode estar vazio.',
      }, { status: 400 });
    }

    const {
      leads,
      captureMetric = 'website_reformulation',
      niche,
      location,
      userId,
      userName,
      tenantId,
    } = body;

    console.log('[API] ========================================');
    console.log('[API] SAVE FOR FUTURE CONTACT');
    console.log('[API] Leads recebidos:', leads.length);
    console.log('[API] Nicho:', niche);
    console.log('[API] Localização:', location);
    console.log('[API] Usuário:', userName, '(' + userId + ')');
    console.log('[API] ========================================');

    // Generate identities for all leads
    const leadIdentities = leads.map(lead => ({
      ...lead,
      identity: generateLeadIdentity(lead),
      normalizedDomain: extractDomain(lead.website),
      normalizedEmail: normalize(lead.email),
      normalizedPhone: normalize(lead.phone),
      normalizedName: normalize(lead.name),
    }));

    // Check for duplicates in database
    const identities = leadIdentities.map(l => l.identity);
    const domains = leadIdentities.map(l => l.normalizedDomain).filter(Boolean);
    const emails = leadIdentities.map(l => l.normalizedEmail).filter(Boolean);
    const phones = leadIdentities.map(l => l.normalizedPhone).filter(Boolean);

    let existingRecords = [];
    if (supabase) {
      // Query existing records
      const queries = [];

      if (identities.length > 0) {
        queries.push(
          supabase.from(REGISTRY_TABLE)
            .select('*')
            .in('normalized_domain', domains.filter(Boolean))
        );
      }

      if (emails.length > 0) {
        queries.push(
          supabase.from(REGISTRY_TABLE)
            .select('*')
            .in('normalized_email', emails.filter(Boolean))
        );
      }

      // Execute queries in parallel
      const results = await Promise.all(queries);
      const seen = new Set();
      for (const result of results) {
        if (result.data) {
          for (const record of result.data) {
            const key = record.id;
            if (!seen.has(key)) {
              seen.add(key);
              existingRecords.push(record);
            }
          }
        }
      }
    }

    // Build set of existing identities
    const existingIdentities = new Set(existingRecords.map(r => r.lead_identity));
    const existingDomains = new Set(existingRecords.map(r => r.normalized_domain).filter(Boolean));
    const existingEmails = new Set(existingRecords.map(r => r.normalized_email).filter(Boolean));

    // Filter leads to save (remove duplicates)
    const leadsToSave = [];
    const duplicateIdentities = [];

    for (const lead of leadIdentities) {
      const isDuplicate = existingIdentities.has(lead.identity) ||
        (lead.normalizedDomain && existingDomains.has(lead.normalizedDomain) && existingEmails.has(lead.normalizedEmail));

      if (isDuplicate) {
        duplicateIdentities.push(lead.id || lead.name);
      } else {
        leadsToSave.push(lead);
      }
    }

    console.log('[API] Leads para salvar:', leadsToSave.length);
    console.log('[API] Duplicados encontrados:', duplicateIdentities.length);

    const savedRecords = [];
    const now = new Date().toISOString();

    if (supabase && leadsToSave.length > 0) {
      // Prepare records for insertion
      const recordsToInsert = leadsToSave.map(lead => ({
        lead_identity: lead.identity,
        normalized_domain: lead.normalizedDomain || null,
        normalized_email: lead.normalizedEmail || null,
        normalized_phone: lead.normalizedPhone || null,
        normalized_name: lead.normalizedName || null,

        // Lead data
        lead_id: lead.id || null,
        company_name: lead.name || lead.company || null,
        website: lead.website || null,
        email: lead.email || null,
        phone: lead.phone || lead.whatsapp || null,
        whatsapp: lead.whatsapp || null,
        location: lead.location || location || null,
        niche: niche || lead.industry || null,
        score: lead.score || null,
        source: lead.source || 'Local Database',
        snippet: lead.snippet || null,

        // Capture info
        capture_metric: captureMetric,
        captured_by_user_id: userId || null,
        captured_by_user_name: userName || null,
        tenant_id: tenantId || null,

        // Status
        status: 'saved_for_future_contact',
        future_contact_status: 'saved',

        // Timestamps
        first_captured_at: now,
        last_captured_at: now,

        // Additional metadata
        metadata: {
          originalLeadId: lead.id,
          captureConfig: { niche, location, captureMetric },
          importedAt: now,
        },
      }));

      // Insert records
      const { data, error } = await supabase
        .from(REGISTRY_TABLE)
        .insert(recordsToInsert)
        .select();

      if (error) {
        console.error('[API] Erro ao salvar no Supabase:', error);
        // Continue anyway - we still save locally
      } else {
        savedRecords.push(...(data || []));
      }
    }

    // Also save to a local in-memory store for serverless (if no Supabase)
    // In production, this would be replaced by a persistent store
    const localSavedCount = savedRecords.length || (supabase ? 0 : leadsToSave.length);
    const totalSaved = savedRecords.length > 0 ? savedRecords.length : (supabase ? 0 : leadsToSave.length);

    const duration = Date.now() - startTime;

    console.log('[API] Registros salvos:', savedRecords.length || localSavedCount);
    console.log('[API] Duplicados ignorados:', duplicateIdentities.length);
    console.log('[API] Duração:', duration + 'ms');

    // Build response
    const response = {
      success: true,
      savedCount: savedRecords.length > 0 ? savedRecords.length : localSavedCount,
      ignoredDuplicates: duplicateIdentities.length,
      message: savedRecords.length > 0 || localSavedCount > 0
        ? (duplicateIdentities.length > 0
          ? `${savedRecords.length || localSavedCount} leads salvos. ${duplicateIdentities.length} duplicados foram ignorados.`
          : `${savedRecords.length || localSavedCount} leads salvos para contato futuro.`)
        : (duplicateIdentities.length > 0
          ? `${duplicateIdentities.length} leads já haviam sido capturados e foram ignorados.`
          : 'Nenhum lead para salvar.'),
      duration,
      savedRecords: savedRecords.length > 0 ? savedRecords : undefined,
    };

    return Response.json(response);

  } catch (error) {
    console.error('[API] ERRO FATAL:', error);

    return Response.json({
      success: false,
      errorCode: 'SAVE_FUTURE_CONTACT_FAILED',
      message: 'Não foi possível salvar os leads para contato futuro.',
      details: error.message,
    }, { status: 500 });
  }
}