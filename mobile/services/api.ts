import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Listing, Stats } from '@/constants/types';

const URL_KEY = 'netlify_base_url';
// Replace with your actual Netlify site URL after deploying
const DEFAULT_URL = 'https://fitness-leads.netlify.app/.netlify/functions';

export async function getApiBase(): Promise<string> {
  return (await AsyncStorage.getItem(URL_KEY)) || DEFAULT_URL;
}

export async function setApiBase(url: string): Promise<void> {
  await AsyncStorage.setItem(URL_KEY, url.replace(/\/$/, ''));
}

async function get(path: string, params?: Record<string, string>): Promise<Response> {
  const base = await getApiBase();
  const url = new URL(`${base}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  }
  return fetch(url.toString());
}

export async function fetchListings(platform?: string, search?: string): Promise<Listing[]> {
  const res = await get('/listings', {
    ...(platform && platform !== 'all' ? { platform } : {}),
    ...(search ? { search } : {}),
  });
  if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`);
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await get('/stats');
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
}

export async function fetchStatus(): Promise<{ running: boolean }> {
  const res = await get('/status');
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.status}`);
  return res.json();
}

export async function triggerRun(): Promise<{ status: string }> {
  const base = await getApiBase();
  const res = await fetch(`${base}/run-background`, { method: 'POST' });
  // Background functions return 202 — treat both 200 and 202 as success
  if (!res.ok && res.status !== 202) throw new Error(`Run failed: ${res.status}`);
  return { status: 'started' };
}
