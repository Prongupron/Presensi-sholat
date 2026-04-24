export interface PrayerEntry {
  id: string;
  date: string; // YYYY-MM-DD
  prayer: 'Zuhur' | 'Ashar';
  fard: boolean;
  qobliyah: boolean;
  badiyah: boolean;
  timestamp: number;
}

export interface DaySummary {
  date: string;
  entries: PrayerEntry[];
}
