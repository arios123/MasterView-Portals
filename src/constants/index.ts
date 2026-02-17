import { User, Client, Project, LineItem } from "@/types";

export const USERS: User[] = [];

export const ROLE_TABS: Record<string, string[]> = {};

export const CLIENTS: Client[] = [
  { id: "c1", name: "Smith", phone: "555-1010", email: "smith@example.com", address: "1 Home St" },
  { id: "c2", name: "Lopez", phone: "555-2020", email: "lopez@example.com", address: "22 Condo Ave" },
];

export const SAMPLE_PROJECTS: Project[] = [
  { id: "p1", clientId: "c1", clientName: "Smith", project: "Kitchen Remodel", residence: "Smith Residence", crew: "— (assign once sold)", note: "Measure complete; waiting on stone quote.", phaseIndex: 2, paid: 0, totalCost: 0, nextPayment: 0, dueStage: "Sold", status: "Estimate" },
  { id: "p2", clientId: "c2", clientName: "Lopez", project: "Master Bath", residence: "Lopez Condo", crew: "— (assign once sold)", note: "Tile approved; ETA pending.", phaseIndex: 1, paid: 0, totalCost: 0, nextPayment: 0, dueStage: "Pre-Con", status: "Picking Materials" },
];

export const CATALOG_LABOR: LineItem[] = [
  { id: "lab1", kind: "labor", name: "Site Measurement & Verification", qty: 1, unitPrice: 250 },
  { id: "lab2", kind: "labor", name: "Dust Control & Containment", qty: 1, unitPrice: 200 },
  { id: "lab3", kind: "labor", name: "Standard Kitchen Remodeling", qty: 1, unitPrice: 3400 },
];

export const CATALOG_MATERIALS: LineItem[] = [
  { id: "mat1", kind: "material", name: "Countertop (Quartz/Granite)", qty: 1, unitPrice: 90, wastePct: 20 },
  { id: "mat2", kind: "material", name: "Cambria Countertop", qty: 1, unitPrice: 130, wastePct: 20 },
  { id: "mat3", kind: "material", name: "Floor Tile", qty: 1, unitPrice: 9, wastePct: 20 },
];