// Lookbook item type
export interface LookbookItem {
  id?: string;
  title: string;
  brand: string;
  link: string;
  finish: string;
  price: string;
  image: string;
  description: string;
  category: string;
  model_number?: string;
  collection?: string;
}

// Dynamic question type (from database)
export interface LookbookQuestion {
  id: string;
  workspace_id: string;
  project_id: string;
  client_id?: string | null; // Kept for potential future use, but nullable since we're starting fresh
  label: string;
  is_long: boolean;
  display_order: number;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
}

// Dynamic answer type (from database)
export interface LookbookAnswer {
  id: string;
  question_id: string;
  project_id: string;
  workspace_id: string;
  answer_text: string;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
}

// Default question type (from database) - workspace-level defaults
export interface LookbookDefaultQuestion {
  id: string;
  workspace_id: string;
  label: string;
  is_long: boolean;
  display_order: number;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
}

// Lookbook answers map (question_id -> answer_text)
export type LookbookAnswers = Record<string, string>;

// Default subcategories (can be extended by data)
export const DEFAULT_SUBCATEGORIES = [
  "Kitchen",
  "Bathroom",
  "Tile",
  "Countertop",
  "Other",
] as const;

// Excluded categories from subcategory list
export const EXCLUDED_CATEGORIES = ["Kitchen Accessories", "Bathroom Accessories"];

