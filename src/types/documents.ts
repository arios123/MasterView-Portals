export interface DocumentType {
  value: string;
  label: string;
}

export interface GeneratedDocument {
  name: string;
  path: string;
  created_at: string;
  is_active?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
}

export interface DocumentChangeOrder {
  version_id: string;
  name: string | null;
  status: string | null;
  created_at: string;
}

export interface TemplateData {
  Date: string;
  QuoteNo: string;
  StartDate: string;
  Weeks: string;
  CustomerName: string;
  CustomerAddress: string;
  CustomerEmail: string;
  CustomerPhoneNumber: string;
  Labor: string;
  MaterialsText: string;
  Materials: Array<{
    LinkedTo: string;
    Title: string;
    Link: string;
    Quantity: number;
  }>;
  ProjectMaterials: string;
  ChangeOrder: string;
  ChangeOrderTotal: string;
  ProjectType: string;
  ProjectTotal: string;
  PTTen: string;
  hasFirstPayment: boolean;
  hasSecondPayment: boolean;
  hasThirdPayment: boolean;
  hasLastPayment: boolean;
  p1: string;
  p2: string;
  p3: string;
  p4: string;
}

export const ALL_DOCUMENT_TYPES: DocumentType[] = [
  { value: 'quote-material-list', label: 'Quote Material List' },
  { value: 'quote-contract', label: 'Quote Contract' },
  { value: 'quote-change-order', label: 'Quote Change Order' },
  { value: 'material-list', label: 'Material List' },
  { value: 'contract', label: 'Contract' },
  { value: 'complimentary-work', label: 'Complimentary Work' },
  { value: 'change-order', label: 'Change Order' },
  { value: 'certificate-completion', label: 'Certificate of Completion' },
  { value: 'addendum-contract', label: 'Addendum to Contract' },
];

export const CHANGE_ORDER_DOCUMENT_TYPES = [
  'change-order',
  'quote-change-order',
  'complimentary-work',
  'addendum-contract',
];

