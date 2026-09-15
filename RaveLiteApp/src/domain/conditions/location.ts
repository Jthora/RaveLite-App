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
