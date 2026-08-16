import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  billingKeys,
  getBalance,
  getLedger,
  getPayments,
  getPlans,
  createOrder,
  verifyPayment,
  reportPaymentFailure,
} from "@/lib/api/billing";

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

/** Paginated payment orders (both successful and failed). */
export function usePayments(limit = 50) {
  return useQuery({
    queryKey: billingKeys.payments(limit),
    queryFn: () => getPayments(limit),
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
 * Create a Razorpay order.
 * Note: balance invalidation happens in the Razorpay handler callback
 * (after actual payment), NOT here (order creation ≠ payment).
 */
export function useCreateOrder() {
  return useMutation({
    mutationFn: ({ priceInr, credits }: { priceInr: number; credits: number }) =>
      createOrder(priceInr, credits),
  });
}

/** Verify a completed Razorpay payment and immediately credit wallet. */
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      paymentId,
      signature,
    }: {
      orderId: string;
      paymentId: string;
      signature: string;
    }) => verifyPayment(orderId, paymentId, signature),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.balance() });
      queryClient.invalidateQueries({ queryKey: billingKeys.ledger() });
      queryClient.invalidateQueries({ queryKey: billingKeys.payments() });
    },
  });
}

/** Report a failed payment attempt to the backend. */
export function useReportPaymentFailure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      paymentId,
      reason,
    }: {
      orderId: string;
      paymentId?: string;
      reason?: string;
    }) => reportPaymentFailure(orderId, paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.payments() });
    },
  });
}

