export interface Item {
  id: string;
  name: string;
  qty: number;
  price: number;
  linkedTo?: string;
  linkedName?: string;
  unmodified?: boolean;
  link?: string;
  notes?: string;
}

export interface ChangeOrder {
  id: string;
  title: string;
  itemsA: Item[];
  itemsB: Item[];
  /** Total of the original sold contract (before this change order's deltas). Used for summary cards. */
  soldContractTotal?: number;
}

