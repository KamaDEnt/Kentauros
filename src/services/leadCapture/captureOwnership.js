import { supabase } from '../supabaseClient';

const CLAIMS_KEY = 'kentauros_capture_claims';

export const getCaptureIdentity = (lead = {}) => {
  const raw = lead.website || lead.email || lead.name || lead.company || '';
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
};

const readClaims = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAIMS_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeClaims = (claims) => {
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));
};

export const getCaptureClaim = (lead) => {
  const identity = getCaptureIdentity(lead);
  const claims = readClaims();
  return identity ? claims[identity] : null;
};

export const claimCaptureForUser = (lead, user) => {
  const identity = getCaptureIdentity(lead);
  if (!identity || !user?.id) {
    return { claimed: false, reason: 'missing_identity' };
  }

  const claims = readClaims();
  const existingClaim = claims[identity];

  if (existingClaim && existingClaim.userId !== user.id) {
    return {
      claimed: false,
      reason: 'already_claimed',
      owner: existingClaim,
      identity,
    };
  }

  const claim = {
    identity,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    role: user.role,
    claimedAt: existingClaim?.claimedAt || new Date().toISOString(),
  };

  claims[identity] = claim;
  writeClaims(claims);

  return { claimed: true, owner: claim, identity };
};

export const assertCaptureAvailableForUser = async (lead, user) => {
  const identity = getCaptureIdentity(lead);
  if (!identity || !user?.id) {
    return { claimed: false, reason: 'missing_identity' };
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('id,user_id,company,email,metadata')
      .eq('tenant_id', user.tenant_id)
      .filter('metadata->>captureIdentity', 'eq', identity)
      .limit(1);

    if (!error && data?.length) {
      const existing = data[0];
      if (Number(existing.user_id) !== Number(user.id)) {
        return {
          claimed: false,
          reason: 'already_claimed',
          owner: existing.metadata || existing,
          identity,
        };
      }
    }
  } catch (error) {
    console.warn('Remote capture ownership check failed:', error.message);
  }

  return claimCaptureForUser(lead, user);
};
