export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  balance: number;
  role: UserRole;
  apiKey?: string;
  currencyPreference?: string;
  photoURL?: string;
  createdAt: any;
}

export interface Provider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  createdAt: any;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  platform?: string;
  rate: number;
  min: number;
  max: number;
  description?: string;
  active: boolean;
  providerId?: string;
  externalServiceId?: string;
  dripFeedEnabled?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  serviceId: string;
  link: string;
  quantity: number;
  charge: number;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'canceled' | 'refunded';
  isDripFeed?: boolean;
  runs?: number;
  interval?: number;
  totalQuantity?: number;
  refillStatus?: 'none' | 'pending' | 'completed' | 'rejected';
  externalOrderId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'charge' | 'refund';
  method: string;
  status: 'pending' | 'completed' | 'failed';
  utr?: string;
  currency?: string;
  exchangeRate?: number;
  createdAt: any;
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'answered' | 'closed';
  createdAt: any;
}
