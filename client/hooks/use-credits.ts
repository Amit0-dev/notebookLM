import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billingKeys, getBalance, getLedger, getPlans, createOrder } from "@/lib/api/billing";

/** Live credit balance + subscription plan. Refreshes every 30 s. */
export function useCredits() {
  return useQuery({
    queryKey: billingKeys.balance(),
    queryFn: getBalance,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/** Paginated ledger (newest first). */
export function useLedger(limit = 50) {
  return useQuery({
    queryKey: billingKeys.ledger(limit),
    queryFn: () => getLedger(limit),
  });
}

/** Available plans — rarely changes, long stale time. */
export function usePlans() {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: getPlans,
    staleTime: 5 * 60_000,
  });
}

/**
 * Create a Razorpay order then invalidate balance after successful payment.
 * Usage:
 *   const { mutateAsync: buy } = useCreateOrder();
 *   const order = await buy({ priceInr: 199, credits: 2500 });
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ priceInr, credits }: { priceInr: number; credits: number }) =>
      createOrder(priceInr, credits),
    onSuccess: () => {
      // After payment the webhook credits the wallet.
      // Invalidate so balance refetches when the user returns to the header.
      queryClient.invalidateQueries({ queryKey: billingKeys.balance() });
      queryClient.invalidateQueries({ queryKey: billingKeys.ledger() });
    },
  });
}
