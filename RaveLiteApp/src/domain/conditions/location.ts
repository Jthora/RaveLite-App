/**
 * Where the operator is, roughly: typed as a town (Open-Meteo's free place
 * search) or detected once by the phone. Stored rounded to a tenth of a
 * degree (about 10 km) and only used for sunrise and the forecast.
 */

export interface Place {
  name: string;
  /** State or region and country, for telling towns apart. */
  region?: string;
  lat: number;
  lon: number;
  source: 'typed' | 'detected';
  setAt: number;
}

export interface PlaceResult {
  name: string;
  region?: string;
  lat: number;
  lon: number;
}

/** A tenth of a degree: about 11 km north–south. */
export function roundCoord(value: number): number {
  return Math.round(value * 10) / 10;
}

export function placeSearchUrl(query: string): string {
  return (
    'https://geocoding-api.open-meteo.com/v1/search' +
    `?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`
  );
}

/** Towns from an Open-Meteo place search; none when nothing matched. */
export function parsePlaces(json: unknown): PlaceResult[] {
  const results = (json as {results?: unknown})?.results;
  if (!Array.isArray(results)) {
    return [];
  }
  return results.flatMap(raw => {
    const r = raw as {
      name?: unknown;
      latitude?: unknown;
      longitude?: unknown;
      admin1?: unknown;
      country?: unknown;
    };
    if (
      typeof r.name !== 'string' ||
      typeof r.latitude !== 'number' ||
      typeof r.longitude !== 'number'
    ) {
      return [];
    }
    const region = [r.admin1, r.country]
      .filter((part): part is string => typeof part === 'string' && !!part)
      .join(', ');
    return [
      {
        name: r.name,
        region: region || undefined,
        lat: r.latitude,
        lon: r.longitude,
      },
    ];
  });
}

/**
 * Place search, in the way people actually type a town.
 *
 * Open-Meteo matches on the name alone: "Swansea IL" finds nothing at all,
 * while "Swansea" finds five and "Swansea, Illinois" finds one. So a query
 * is split into a name and a region hint, tried from the most specific
 * form to the least, and the results are ranked by the hint.
 */

const US_STATES: Readonly<Record<string, string>> = {
  al: 'Alabama',
  ak: 'Alaska',
  az: 'Arizona',
  ar: 'Arkansas',
  ca: 'California',
  co: 'Colorado',
  ct: 'Connecticut',
  de: 'Delaware',
  dc: 'District of Columbia',
  fl: 'Florida',
  ga: 'Georgia',
  hi: 'Hawaii',
  id: 'Idaho',
  il: 'Illinois',
  in: 'Indiana',
  ia: 'Iowa',
  ks: 'Kansas',
  ky: 'Kentucky',
  la: 'Louisiana',
  me: 'Maine',
  md: 'Maryland',
  ma: 'Massachusetts',
  mi: 'Michigan',
  mn: 'Minnesota',
  ms: 'Mississippi',
  mo: 'Missouri',
  mt: 'Montana',
  ne: 'Nebraska',
  nv: 'Nevada',
  nh: 'New Hampshire',
  nj: 'New Jersey',
  nm: 'New Mexico',
  ny: 'New York',
  nc: 'North Carolina',
  nd: 'North Dakota',
  oh: 'Ohio',
  ok: 'Oklahoma',
  or: 'Oregon',
  pa: 'Pennsylvania',
  ri: 'Rhode Island',
  sc: 'South Carolina',
  sd: 'South Dakota',
  tn: 'Tennessee',
  tx: 'Texas',
  ut: 'Utah',
  vt: 'Vermont',
  va: 'Virginia',
  wa: 'Washington',
  wv: 'West Virginia',
  wi: 'Wisconsin',
  wy: 'Wyoming',
};

const STATE_NAMES = new Set(Object.values(US_STATES).map(s => s.toLowerCase()));

/** "IL" → "Illinois"; a state or country name → itself; anything else → none. */
function asRegion(text: string): string | undefined {
  const key = text.trim().toLowerCase().replace(/\.$/, '');
  if (!key) {
    return undefined;
  }
  if (US_STATES[key]) {
    return US_STATES[key];
  }
  if (STATE_NAMES.has(key)) {
    return text.trim();
  }
  if (
    [
      'usa',
      'us',
      'united states',
      'uk',
      'england',
      'wales',
      'scotland',
      'canada',
      'australia',
    ].includes(key)
  ) {
    return text.trim();
  }
  return undefined;
}

export interface SearchPlan {
  /** Queries to try, most specific first. */
  terms: string[];
  /** The region the operator meant, for ranking what comes back. */
  hint?: string;
}

/** How to look a typed place up, given that the API only matches names. */
export function planSearch(raw: string): SearchPlan {
  const text = raw.trim().replace(/\s+/g, ' ');
  if (!text) {
    return {terms: []};
  }
  const terms = [text];
  let hint: string | undefined;

  const [head, ...rest] = text.split(',').map(part => part.trim());
  if (rest.length > 0 && head) {
    hint = asRegion(rest.join(' ')) ?? rest.join(' ');
    terms.push(head);
  } else {
    const words = text.split(' ');
    if (words.length > 1) {
      const region = asRegion(words[words.length - 1]);
      if (region) {
        hint = region;
        terms.push(words.slice(0, -1).join(' '));
      } else {
        // Last resort: the first word is the town, the rest is a hint.
        hint = words.slice(1).join(' ');
        terms.push(words[0]);
      }
    }
  }
  return {
    terms: terms.filter((t, i) => t.length > 1 && terms.indexOf(t) === i),
    hint,
  };
}

/** Places whose region matches the hint first; the rest keep their order. */
export function rankPlaces(
  places: readonly PlaceResult[],
  hint?: string,
): PlaceResult[] {
  if (!hint) {
    return [...places];
  }
  const wanted = (asRegion(hint) ?? hint).toLowerCase();
  const matches = (place: PlaceResult) =>
    (place.region ?? '').toLowerCase().includes(wanted);
  const hit = places.filter(matches);
  return hit.length > 0
    ? [...hit, ...places.filter(p => !matches(p))]
    : [...places];
}
