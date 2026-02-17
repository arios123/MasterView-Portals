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
  isDeleted?: boolean; // For change orders: marks item as deleted but keeps it visible
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
  title: string; // NEW: Event title (required)
  clientId?: string; // Now optional
  clientName?: string; // Now optional
  projectId?: string; // NEW: FK to projects
  projectType?: string; // Now optional
  appointmentTypeId?: string; // Now optional
  address?: string;
  assignedTo: string[]; // Keep for backward compatibility
  date: string;
  time: string;
  // REMOVED: notes, phone, email
};

export type User = {
  id: string;
  name: string;
  role: string;
};