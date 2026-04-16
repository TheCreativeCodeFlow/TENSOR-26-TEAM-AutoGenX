import { fetchJson, fetchWithRetry } from './client';
import type { IMDWarning } from './types';

const IMD_FISHERMEN_URL = 'https://mausam.imd.gov.in/imd_latest/contents/index_fisherman.php';

export async function fetchIMDFishermenWarnings(): Promise<IMDWarning[]> {
  try {
    const response = await fetchWithRetry(IMD_FISHERMEN_URL, {}, 2);
    const html = await response.text();
    
    const warnings = parseIMDHTML(html);
    return warnings;
  } catch (error) {
    console.error('Failed to fetch IMD warnings:', error);
    return [];
  }
}

function parseIMDHTML(html: string): IMDWarning[] {
  const warnings: IMDWarning[] = [];
  
  const zonePatterns: { pattern: RegExp; zone: string }[] = [
    { pattern: /Tamil\s*Nadu/i, zone: 'Tamil Nadu' },
    { pattern: /Kerala/i, zone: 'Kerala' },
    { pattern: /Andhra/i, zone: 'Andhra Pradesh' },
    { pattern: /Odisha/i, zone: 'Odisha' },
    { pattern: /South\s*TN/i, zone: 'South Tamil Nadu Coast' },
    { pattern: /North\s*TN/i, zone: 'North Tamil Nadu Coast' },
  ];

  const severityPatterns = [
    { pattern: /\bWARNING\b/i, severity: 'WARNING' as const },
    { pattern: /\bWARNING\s*FOR\s*(Fishermen|Sailors)/i, severity: 'WARNING' as const },
    { pattern: /\bALERT\b/i, severity: 'ADVISORY' as const },
    { pattern: /\bADVISORY\b/i, severity: 'ADVISORY' as const },
    { pattern: /\bNO\s*WARNING\b/i, severity: 'NO_WARNING' as const },
    { pattern: /\bFAIR\b/i, severity: 'NO_WARNING' as const },
  ];

  const tableMatches = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
  
  if (tableMatches) {
    tableMatches.forEach((table, index) => {
      const rows = table.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      if (rows && rows.length > 1) {
        rows.slice(1).forEach((row) => {
          const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
          if (cells && cells.length >= 2) {
            const text = cells.join(' ').replace(/<[^>]+>/g, ' ').trim();
            
            for (const zonePattern of zonePatterns) {
              if (zonePattern.pattern.test(text)) {
                let severity: 'WARNING' | 'ADVISORY' | 'NO_WARNING' = 'NO_WARNING';
                
                for (const sevPattern of severityPatterns) {
                  if (sevPattern.pattern.test(text)) {
                    severity = sevPattern.severity;
                    break;
                  }
                }
                
                warnings.push({
                  id: `imd-${index}-${Date.now()}`,
                  zone: zonePattern.zone,
                  severity,
                  title: text.substring(0, 200),
                  valid_from: new Date().toISOString(),
                  valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  issued_at: new Date().toISOString(),
                  source: 'IMD',
                });
                break;
              }
            }
          }
        });
      }
    });
  }

  if (warnings.length === 0) {
    warnings.push({
      id: 'imd-default-' + Date.now(),
      zone: 'All Coastal Zones',
      severity: 'NO_WARNING',
      title: 'No fishermen warning issued',
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      issued_at: new Date().toISOString(),
      source: 'IMD',
    });
  }

  return warnings;
}

export function getIMDZoneMapping(imdZoneCode: string): string[] {
  const mapping: Record<string, string[]> = {
    'SOUTH_TN_COAST': ['TN-01', 'TN-02', 'TN-03'],
    'NORTH_TN_COAST': ['TN-04'],
    'KERALA_COAST': ['KL-01', 'KL-02', 'KL-03'],
    'NORTH_KERALA_COAST': ['KL-03'],
    'SOUTH_AP_COAST': ['AP-01'],
    'NORTH_AP_COAST': ['AP-02'],
    'SOUTH_ODISHA_COAST': ['OD-01'],
    'NORTH_ODISHA_COAST': ['OD-02'],
  };
  
  return mapping[imdZoneCode] || [];
}

export async function fetchCycloneData(): Promise<{
  active: boolean;
  cyclone: {
    name: string;
    coordinates: { lat: number; lon: number };
    intensity: string;
    max_wind_kt: number;
    track: { time: string; lat: number; lon: number }[];
    landfall_eta: string;
    landfall_location: string;
    distance_km: number;
  } | null;
} | null> {
  try {
    const cycloneUrl = 'https://mausam.imd.gov.in/imd_latest/contents/cyclone.php';
    const response = await fetchWithRetry(cycloneUrl, {}, 2);
    const html = await response.text();
    
    return parseCycloneHTML(html);
  } catch (error) {
    console.error('Failed to fetch cyclone data:', error);
    return { active: false, cyclone: null };
  }
}

function parseCycloneHTML(html: string): {
  active: boolean;
  cyclone: {
    name: string;
    coordinates: { lat: number; lon: number };
    intensity: string;
    max_wind_kt: number;
    track: { time: string; lat: number; lon: number }[];
    landfall_eta: string;
    landfall_location: string;
    distance_km: number;
  } | null;
} | null {
  const hasCyclone = /cyclone|deep\s+depression|storm/i.test(html);
  
  if (!hasCyclone) {
    return { active: false, cyclone: null };
  }

  const nameMatch = html.match(/Cyclone\s+(\w+)/i);
  const coordsMatch = html.match(/(\d+\.?\d*)[°N],\s*(\d+\.?\d*)[°E]/i);
  const windMatch = html.match(/(\d+)\s*knots?/i);
  
  if (!coordsMatch) {
    return { active: true, cyclone: null };
  }

  return {
    active: true,
    cyclone: {
      name: nameMatch ? nameMatch[1] : 'Unknown',
      coordinates: {
        lat: parseFloat(coordsMatch[1]),
        lon: parseFloat(coordsMatch[2]),
      },
      intensity: 'CYCLONE',
      max_wind_kt: windMatch ? parseInt(windMatch[1]) : 0,
      track: [],
      landfall_eta: 'Unknown',
      landfall_location: 'Unknown',
      distance_km: 0,
    },
  };
}