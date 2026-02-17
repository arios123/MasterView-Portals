import { LineItem } from "@/types";

export function computeTotals(items: LineItem[], taxRate = 0.06) {
  const rows = items.map((r) => {
    const waste = r.kind === "material" ? r.wastePct ?? (/tile|countertop/i.test(r.name) ? 20 : 0) : 0;
    const qtyWithWaste = r.kind === "material" ? r.qty * (1 + waste / 100) : r.qty;
    const total = qtyWithWaste * r.unitPrice;
    return { ...r, total } as LineItem & { total: number };
  });
  const laborSub = rows.filter((r) => r.kind === "labor").reduce((a, r: any) => a + r.total, 0);
  const matSub = rows.filter((r) => r.kind === "material").reduce((a, r: any) => a + r.total, 0);
  const tax = matSub * taxRate; // tax on materials only
  const sub = laborSub + matSub + tax;
  return { laborSub, matSub, tax, sub };
}
