import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectBingApiCandidates,
  collectGooglePlacesApiCandidates,
  collectOfficialLeadCandidates,
} from './officialLeadProviders.js';

const jsonResponse = (body) => ({
  ok: true,
  json: async () => body,
});

test('collects candidates from Bing Search API when configured', async () => {
  process.env.BING_SEARCH_API_KEY = 'test-key';
  const candidates = await collectBingApiCandidates(['clinicas sp'], async () => jsonResponse({
    webPages: {
      value: [
        { name: 'Clinica Alfa', url: 'https://www.clinicaalfa.com.br', snippet: 'Contato e agendamento' },
      ],
    },
  }));

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].source, 'Bing Search API');
  assert.equal(candidates[0].website, 'https://clinicaalfa.com.br');
  delete process.env.BING_SEARCH_API_KEY;
});

test('collects candidates from Google Places API when configured', async () => {
  process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  const candidates = await collectGooglePlacesApiCandidates({ niche: 'clinica', location: 'sao paulo' }, async () => jsonResponse({
    places: [
      {
        id: 'place-1',
        displayName: { text: 'Clinica Beta' },
        websiteUri: 'https://www.clinicabeta.com.br/',
        formattedAddress: 'Sao Paulo',
        nationalPhoneNumber: '(11) 3333-4444',
        businessStatus: 'OPERATIONAL',
      },
      {
        id: 'place-2',
        displayName: { text: 'Fechada' },
        websiteUri: 'https://fechada.com.br',
        businessStatus: 'CLOSED_PERMANENTLY',
      },
    ],
  }));

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].source, 'Google Places API');
  assert.equal(candidates[0].placeId, 'place-1');
  delete process.env.GOOGLE_PLACES_API_KEY;
});

test('deduplicates official provider candidates by website', async () => {
  process.env.BING_SEARCH_API_KEY = 'test-key';
  process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  const candidates = await collectOfficialLeadCandidates({ niche: 'clinica', location: 'sp' }, ['clinica sp'], async (url) => {
    if (String(url).includes('places.googleapis.com')) {
      return jsonResponse({
        places: [{ id: 'p1', displayName: { text: 'Clinica' }, websiteUri: 'https://clinica.com.br', businessStatus: 'OPERATIONAL' }],
      });
    }
    return jsonResponse({
      webPages: { value: [{ name: 'Clinica', url: 'https://www.clinica.com.br', snippet: 'Contato' }] },
    });
  });

  assert.equal(candidates.length, 1);
  delete process.env.BING_SEARCH_API_KEY;
  delete process.env.GOOGLE_PLACES_API_KEY;
});
