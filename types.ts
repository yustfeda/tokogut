
export interface UserProfile {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  totalSpent?: number;
  mysteryBoxPlays?: number;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  isAvailable: boolean;
}

export interface PendingOrder {
    id: string;
    userId: string;
    userEmail: string;
    type: 'product' | 'mystery_box';
    productName?: string;
    timestamp: number;
}

export interface PurchaseHistoryItem {
    id: string;
    name: string;
    type: 'product' | 'mystery_box';
    price: number;
    timestamp: number;
}

export interface Message {
  id: string;
  text: string;
  read: boolean;
  timestamp: number;
}

export interface Notification {
  id: string;
  text: string;
  read: boolean;
  timestamp: number;
}

export interface LeaderboardEntry {
  id: string;
  email: string;
  itemWon: string;
  timestamp: number;
  winCount: number;
}

export interface MysteryBoxState {
    canOpen: boolean;
    willWin: boolean;
}
