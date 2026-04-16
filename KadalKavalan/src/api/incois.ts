import { fetchWithRetry } from './client';
import type { INCOISAlert } from './types';

const INCOIS_HWA_URL = 'https://incois.gov.in/portal/osf/hwa.jsp';

export async function fetchINCOISHighWaveAlerts(): Promise<INCOISAlert[]> {
  try {
    const response = await fetchWithRetry(INCOIS_HWA_URL, {}, 2);
    const html = await response.text();
    
    const alerts = parseINCOISHTML(html);
    return alerts;
  } catch (error) {
    console.error('Failed to fetch INCOIS alerts:', error);
    return [];
  }
}

function parseINCOISHTML(html: string): INCOISAlert[] {
  const alerts: INCOISAlert[] = [];
  
  const coastPatterns: { pattern: RegExp; coast: string }[] = [
    { pattern: /Tamil\s*Nadu/i, coast: 'Tamil Nadu' },
    { pattern: /Kerala/i, coast: 'Kerala' },
    { pattern: /Andhra/i, coast: 'Andhra Pradesh' },
    { pattern: /Odisha/i, coast: 'Odisha' },
    { pattern: /South\s*Coast/i, coast: 'South Coast' },
    { pattern: /North\s*Coast/i, coast: 'North Coast' },
    { pattern: /Gulf\s*of\s*Mannar/i, coast: 'Gulf of Mannar' },
    { pattern: /Palk\s*Strait/i, coast: 'Palk Strait' },
    { pattern: /Bay\s*of\s*Bengal/i, coast: 'Bay of Bengal' },
  ];

  const heightMatch = html.match(/(\d+\.?\d*)\s*m/gi);
  const validMatch = html.match(/valid\s*(?:from|until|upto)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
  
  const regions = ['Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Odisha'];
  
  regions.forEach((region, index) => {
    const hasAlert = new RegExp(region, 'i').test(html);
    
    if (hasAlert && heightMatch) {
      const waveHeight = heightMatch[index] ? parseFloat(heightMatch[index]) : 2.0;
      
      alerts.push({
        id: `incois-${region.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
        coast: region,
        wave_height_m: waveHeight,
        valid_from: validMatch ? validMatch[1] : new Date().toISOString(),
        valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        advisory_text: `High wave alert for ${region}. Wave height up to ${waveHeight}m expected.`,
        source: 'INCOIS',
      });
    }
  });

  if (alerts.length === 0) {
    alerts.push({
      id: 'incois-default-' + Date.now(),
      coast: 'All Coasts',
      wave_height_m: 0,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      advisory_text: 'No high wave alert issued.',
      source: 'INCOIS',
    });
  }

  return alerts;
}

export async function fetchINCOISSVAS(boatClass: string): Promise<{
  advisory: string;
  zone: string;
  valid_until: string;
} | null> {
  try {
    const svasUrl = 'https://incois.gov.in/portal/osf/';
    const response = await fetchWithRetry(svasUrl, {}, 2);
    const html = await response.text();
    
    if (html.toLowerCase().includes('no warning') || html.toLowerCase().includes('all clear')) {
      return {
        advisory: 'No specific advisory for your boat type.',
        zone: 'All Zones',
        valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    
    return {
      advisory: 'Conditions may be dangerous. Exercise caution.',
      zone: 'All Coastal Zones',
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch INCOIS SVAS:', error);
    return null;
  }
}

export function getINCOISZoneMapping(incoisZoneCode: string): string[] {
  const mapping: Record<string, string[]> = {
    'TN_N_MANNAR': ['TN-01'],
    'TN_S_MANNAR': ['TN-02'],
    'TN_PALK': ['TN-03'],
    'TN_N_COAST': ['TN-04'],
    'KL_LAKSHADWEEP': ['KL-01'],
    'KL_CENTRAL': ['KL-02'],
    'KL_NORTH': ['KL-03'],
    'AP_SOUTH': ['AP-01'],
    'AP_NORTH': ['AP-02'],
    'OD_SOUTH': ['OD-01'],
    'OD_NORTH': ['OD-02'],
  };
  
  return mapping[incoisZoneCode] || [];
}