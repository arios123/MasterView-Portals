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
  Multiplier: string;
  ClientName: string;
  ClientEmail: string;
  ClientPhoneNumber: string;
  AssignedStaffName: string;
  AssignedStaffEmail: string;
  ProjectTitle: string;
  ProjectType: string;
  ProjectAddress: string;
  ProjectStatus: string;
  QuickNotes: string;
  Notes: string;
  Labor: Array<{
    LaborTitle: string;
    LaborQty: number;
    LaborPrice: string;
    LaborTotal: string;
  }>;
  MaterialsText: string;
  Materials: Array<{
    MaterialsLinkedTo: string;
    MaterialsTitle: string;
    MaterialsLink: string;
    MaterialsQuantity: number;
    MaterialsNotes: string;
    MaterialsPrice: string;
    MaterialsTotal: string;
  }>;
  AssignedCrew: Array<{
    AssignedCrewName: string;
    AssignedCrewEmail: string;
  }>;
  LookbookQ: Array<{
    LookbookQQuestions: string;
    LookbookQAnswers: string;
  }>;
  LookbookS: Array<{
    LookbookSCategory: string;
    LookbookSTitle: string;
    LookbookSBrand: string;
    LookbookSStyle: string;
    LookbookSFinish: string;
    LookbookSLink: string;
    LookbookSPrice: string;
    LookbookSModel: string;
    LookbookSCollection: string;
  }>;
  ProjectMaterials: Array<{
    ProjectMaterialsTitle: string;
    ProjectMaterialsQty: number;
    ProjectMaterialsPrice: string;
    ProjectMaterialsTotal: string;
  }>;
  ChangeOrderProjectMaterials: Array<{
    // Before (baseline)
    ChangeOrderProjectMaterialsTitleB: string;
    ChangeOrderProjectMaterialsQtyB: string;
    ChangeOrderProjectMaterialsPriceB: string;
    ChangeOrderProjectMaterialsTotalB: string;
    // After (CO result)
    ChangeOrderProjectMaterialsTitleA: string;
    ChangeOrderProjectMaterialsQtyA: string;
    ChangeOrderProjectMaterialsPriceA: string;
    ChangeOrderProjectMaterialsTotalA: string;
    // Delta (After − Before)
    ChangeOrderProjectMaterialsQtyD: string;
    ChangeOrderProjectMaterialsPriceD: string;
    ChangeOrderProjectMaterialsTotalD: string;
    // Change type
    ChangeOrderProjectMaterialsChange: string;
  }>;
  ChangeOrderLabor: Array<{
    // Before (baseline)
    ChangeOrderLaborTitleB: string;
    ChangeOrderLaborQtyB: string;
    ChangeOrderLaborPriceB: string;
    ChangeOrderLaborTotalB: string;
    // After (CO result)
    ChangeOrderLaborTitleA: string;
    ChangeOrderLaborQtyA: string;
    ChangeOrderLaborPriceA: string;
    ChangeOrderLaborTotalA: string;
    // Delta (After − Before)
    ChangeOrderLaborQtyD: string;
    ChangeOrderLaborPriceD: string;
    ChangeOrderLaborTotalD: string;
    // Change type
    ChangeOrderLaborChange: string;
  }>;
  ChangeOrderMaterials: Array<{
    ChangeOrderMaterialsLinkedTo: string;
    ChangeOrderMaterialsTitle: string;
    ChangeOrderMaterialsLink: string;
    ChangeOrderMaterialsQuantity: number;
    ChangeOrderMaterialsNotes: string;
    ChangeOrderMaterialsPrice: string;
    ChangeOrderMaterialsTotal: string;
  }>;
  IncomingPayments: Array<{
    IncomingPaymentsDate: string;
    IncomingPaymentsAmount: string;
    IncomingPaymentsType: string;
    IncomingPaymentsReceivedBy: string;
    IncomingPaymentsFor: string;
    IncomingPaymentsNotes: string;
  }>;
  OutgoingPayments: Array<{
    OutgoingPaymentsDate: string;
    OutgoingPaymentsItem: string;
    OutgoingPaymentsLink: string;
    OutgoingPaymentsTotalPrice: string;
    OutgoingPaymentsQty: string;
    OutgoingPaymentsTracking: string;
    OutgoingPaymentsNotes: string;
  }>;
  ChangeOrder: string;
  ContractTotal: string;
  ChangeOrderTotal: string;
  AllChangeOrderTotal: string;
  ProjectTotal: string;
  TotalPaid: string;
  Balance: string;
  PTTen: string;
  hasFirstPayment: boolean;
  hasSecondPayment: boolean;
  hasThirdPayment: boolean;
  hasLastPayment: boolean;
  Payment1: string;
  Payment2: string;
  Payment3: string;
  Payment4: string;
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

