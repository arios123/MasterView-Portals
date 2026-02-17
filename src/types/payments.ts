export interface IncomingPayment {
  id?: string;
  date: string;
  amount: string;
  type: string;
  receivedBy: string;
  forField: string;
  notes: string;
  created_by?: string | null;
  created_at?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
}

export interface OutgoingPayment {
  id?: string;
  date: string;
  item: string;
  link: string;
  totalPrice: string;
  qty: string;
  tracking: string;
  notes: string;
  created_by?: string | null;
  created_at?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
}

export interface Material {
  id: string;
  name: string;
  link?: string;
  price: number;
  qty: number;
  source: 'draft' | 'changeOrder';
  versionId?: string;
  notes?: string;
}

export interface PaymentCalculations {
  contractTotal: number;
  changeOrdersTotal: number;
  projectTotal: number;
  paidTotal: number;
  balance: number;
  nextPayment: number;
  totalProjectCost: number;
  totalSpentOnProject: number;
  totalProfit: number;
}

