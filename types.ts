
export enum WatchlistStatus {
  Suspect = 'ผู้ต้องสงสัย',
  Charged = 'ถูกตั้งข้อหา',
  Convicted = 'มีความผิด',
  Cleared = 'พ้นข้อกล่าวหา',
}

export interface WatchlistItem {
  id: string;
  name: string;
  alias: string;
  status: WatchlistStatus;
  charges: string[];
  lastUpdated: string;
  imageUrl: string;
}

export interface ReviewItem {
  id: string;
  timestamp: string;
  camera: string;
  imageUrl: string;
  matches: {
    watchlistItem: WatchlistItem;
    confidence: number;
  }[];
}

export interface AuditLog {
    id: string;
    timestamp: string;
    user: string;
    activity: string;
    details: string;
    result: 'สำเร็จ' | 'ล้มเหลว';
}
