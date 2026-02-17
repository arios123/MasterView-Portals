export const PHASES = ["Pre-Sale", "Visits", "Selections", "Sold", "Pre-Con", "Build", "Closeout"] as const;

// Note: STATUSES is now dynamic per workspace - use useProjectStatuses hook to get workspace-specific statuses
// Keeping this for backward compatibility during migration, but it should not be used in new code
export const STATUSES = ["Estimate", "Picking Materials", "Pending", "Sold", "Under Construction", "Completed", "Lost"] as const;

export type Project = {
  id: string;
  clientId: string;
  clientName: string;
  project: string;
  residence: string;
  crew: string;
  note: string;
  phaseIndex: number;
  paid: number;
  totalCost: number;
  nextPayment: number;
  dueStage: string;
  status: string | null; // Now dynamic per workspace, can be null if status was deleted
  assignedUserId?: string;
  quickNote?: string;
};

export type Client = { 
  id: string; 
  name: string; 
  phone?: string; 
  email?: string; 
  address?: string;
};

export type LineItem = {
  id: string;
  kind: "labor" | "material";
  name: string;
  qty: number;
  unitPrice: number;
  wastePct?: number; // materials only
  link?: string;
  /** When true, item is shown as removed (strikethrough, red border) and excluded from totals; used in change orders. */
  isDeleted?: boolean;
};

export type IncomingPayment = {
  id: string;
  date: string;
  amount: number;
  note?: string;
};

export type OutgoingPayment = {
  id: string;
  date: string;
  materialName: string;
  budget: number;
  adjustedPrice?: number;
  actualPaid?: number;
  link?: string;
  tracking?: string;
};

export type EventItem = {
  id: string;
  title: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectType?: string;
  appointmentTypeId?: string;
  address?: string;
  assignedTo: string[];
  date: string;
  time: string;
};

export type User = {
  id: string;
  name: string;
  role: string;
};