"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { LowBalanceDialog } from "@/components/billing/low-balance-dialog";

type BillingContextValue = {
  openLowBalanceDialog: () => void;
};

const BillingContext = createContext<BillingContextValue | null>(null);

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used within BillingProvider");
  return ctx;
}

/**
 * Provides global access to the low-balance 402 dialog.
 * The buy-credits flow is now a dedicated page (/dashboard/billing),
 * so the sheet is no longer managed here.
 */
export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const openLowBalanceDialog = useCallback(() => setDialogOpen(true), []);

  return (
    <BillingContext.Provider value={{ openLowBalanceDialog }}>
      {children}
      <LowBalanceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </BillingContext.Provider>
  );
}
