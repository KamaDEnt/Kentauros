import { supabase } from './supabaseClient';

/**
 * Middleware de Frontend para injetar o tenant_id nas requisições do Supabase.
 * Isso garante que todas as queries respeitem o isolamento de dados do Multi-Tenant.
 *
 * @param {object} queryBuilder - Instância de consulta do Supabase (ex: supabase.from('...').select('*'))
 * @param {string} tenantId - ID do tenant do usuário atual
 * @returns {object} O queryBuilder com o filtro de tenant aplicado
 */
export const withTenant = (queryBuilder, tenantId) => {
  if (!tenantId) {
    console.warn('Aviso: Consulta realizada sem tenant_id. Verifique a sessão do usuário.');
    return queryBuilder; // Dependendo do rigor, pode lançar um Error.
  }
  return queryBuilder.eq('tenant_id', tenantId);
};
