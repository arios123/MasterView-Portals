import React, { createContext, useContext } from "react";

const PriceContext = createContext({ hidden: false, setHidden: (_: boolean) => {} });

export const usePrice = () => useContext(PriceContext);

export const Money: React.FC<{ value?: number; alwaysVisible?: boolean }> = ({ value = 0, alwaysVisible = false }) => {
  const { hidden } = usePrice();
  if (hidden && !alwaysVisible) return <span>—</span>;
  return <span>{`$${(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>;
};

export { PriceContext };