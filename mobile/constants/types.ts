export interface Listing {
  id: string;
  url: string;
  title: string;
  snippet?: string;
  platform: string;
  is_new: boolean;
  found_at: string;
  posted_at?: string | null;
}

export interface Stats {
  total: number;
  newToday: number;
  byPlatform: { platform: string; count: number }[];
  lastRun: {
    ran_at: string;
    found_count: number;
    error_msg?: string | null;
  } | null;
}
