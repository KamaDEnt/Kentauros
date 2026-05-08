const DEFAULT_HEADERS = {
  'accept': 'application/json',
  'accept-language': 'pt-BR,pt;q=0.9,en;q=0.7',
  'user-agent': 'KentaurosLeadCapture/1.0',
};

const normalizeWebsiteUrl = (rawUrl = '') => {
  if (!rawUrl) return null;
  try {
    const url = new URL(String(rawUrl).startsWith('http') ? rawUrl : `https://${rawUrl}`);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    return `${url.protocol}//${url.hostname.toLowerCase().replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}`.replace(/\/$/, '');
  } catch {
    return null;
  }
};

const fetchJson = async (url, options = {}, fetchImpl = fetch) => {
  const response = await fetchImpl(url, {
    ...options,
    headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
  });

  if (!response.ok) {
    throw new Error(`Provider returned ${response.status}`);
  }

  return response.json();
};

export const collectBingApiCandidates = async (queries = [], fetchImpl = fetch, targetCount = 80) => {
  const apiKey = process.env.BING_SEARCH_API_KEY;
  if (!apiKey) return [];

  const endpoint = process.env.BING_SEARCH_ENDPOINT || 'https://api.bing.microsoft.com/v7.0/search';
  const candidates = [];
  const seen = new Set();

  for (const query of queries) {
    if (candidates.length >= targetCount) break;
    const url = `${endpoint}?q=${encodeURIComponent(query)}&mkt=pt-BR&count=50&responseFilter=Webpages`;
    try {
      const json = await fetchJson(url, { headers: { 'Ocp-Apim-Subscription-Key': apiKey } }, fetchImpl);
      const results = json.webPages?.value || [];
      for (const result of results) {
        const website = normalizeWebsiteUrl(result.url);
        if (!website || seen.has(website)) continue;
        seen.add(website);
        candidates.push({
          name: result.name,
          website,
          description: result.snippet,
          source: 'Bing Search API',
          providerMetadata: { officialProvider: true },
        });
      }
    } catch {
      // Keep fallback sources alive when the official provider throttles or is misconfigured.
    }
  }

  return candidates;
};

export const collectGooglePlacesApiCandidates = async (config = {}, fetchImpl = fetch, targetCount = 80) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const query = `${config.niche || ''} ${config.location || ''}`.trim();
  if (!query) return [];

  try {
    const json = await fetchJson('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.businessStatus',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'pt-BR',
        maxResultCount: Math.min(20, targetCount),
      }),
    }, fetchImpl);

    return (json.places || [])
      .filter(place => place.businessStatus !== 'CLOSED_PERMANENTLY')
      .map(place => ({
        name: place.displayName?.text || '',
        website: normalizeWebsiteUrl(place.websiteUri),
        source: 'Google Places API',
        mapsAddress: place.formattedAddress,
        mapsPhone: place.nationalPhoneNumber,
        placeId: place.id,
        providerMetadata: {
          officialProvider: true,
          storagePolicy: 'Store only operational lead fields and place_id; refresh Place details when needed.',
        },
      }))
      .filter(candidate => candidate.name && candidate.website);
  } catch {
    return [];
  }
};

export const collectOfficialLeadCandidates = async (config = {}, queries = [], fetchImpl = fetch, targetCount = 100) => {
  const [places, bing] = await Promise.all([
    collectGooglePlacesApiCandidates(config, fetchImpl, Math.ceil(targetCount / 2)),
    collectBingApiCandidates(queries, fetchImpl, Math.ceil(targetCount / 2)),
  ]);

  const seen = new Set();
  return [...places, ...bing].filter(candidate => {
    const key = normalizeWebsiteUrl(candidate.website);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
