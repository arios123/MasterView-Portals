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

// Unit Tests
(function runUnitTests(){
  const items: LineItem[] = [
    { id: "t1", kind: "labor", name: "Demo", qty: 2, unitPrice: 100 },
    { id: "t2", kind: "material", name: "Tile", qty: 100, unitPrice: 10, wastePct: 20 },
  ];
  const { laborSub, matSub, tax, sub } = computeTotals(items);
  // Expectations
  const expectedLabor = 200; // 2 * 100
  const expectedMat = 100 * 1.2 * 10; // 20% waste
  const expectedTax = expectedMat * 0.06;
  const ok = Math.abs(laborSub - expectedLabor) < 1e-6 && Math.abs(matSub - expectedMat) < 1e-6 && Math.abs(tax - expectedTax) < 1e-6 && Math.abs(sub - (expectedLabor + expectedMat + expectedTax)) < 1e-6;
  // eslint-disable-next-line no-console
  console.log("[Portal tests] totals:", ok ? "OK" : "FAILED", { laborSub, matSub, tax, sub });
})();