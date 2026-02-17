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

// Question field configuration
export interface QuestionField {
  id: string;
  label: string;
  long?: boolean;
}

// Lookbook questions (form answers)
export type LookbookAnswers = Record<string, string>;

// Question fields schema
export const QUESTION_FIELDS: QuestionField[] = [
  { id: "budget", label: "Budget" },
  { id: "timeline", label: "Timeline" },
  { id: "mainGoal", label: "Main goal", long: true },
  { id: "liveInHome", label: "Live in home during project?" },
  { id: "houseTypeAge", label: "House type & age" },
  { id: "projectFloor", label: "Project floor" },
  { id: "foundation", label: "Foundation" },
  { id: "hoa", label: "HOA rules" },
  { id: "pastRenos", label: "Past renos / issues", long: true },
  { id: "finishesColors", label: "Finishes & colors" },
  { id: "changesWanted", label: "Changes wanted", long: true },
  { id: "style", label: "Style" },
  { id: "inspo", label: "Inspiration links", long: true },
  { id: "useOfSpace", label: "Use of space", long: true },
  { id: "kidsPets", label: "Kids / pets / access" },
  { id: "storageNeeds", label: "Storage needs" },
  { id: "stayDuration", label: "How long will you stay?" },
  { id: "electrical", label: "Electrical updates?" },
  { id: "gasType", label: "Gas type" },
  { id: "water", label: "Water source" },
  { id: "hvac", label: "HVAC issues" },
  { id: "workRestrictions", label: "Work restrictions" },
  { id: "permits", label: "Permits" },
];

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

