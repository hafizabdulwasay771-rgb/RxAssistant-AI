import { supabase } from "@/lib/supabase";

export const plans = {
  monthly: { key: "monthly", label: "Monthly", billingPeriod: "monthly", amount: 3500, displayAmount: "PKR 3,500", detail: "PKR 3,500 / month" },
  six_months: { key: "six_months", label: "6 Months", billingPeriod: "6_months", amount: 19000, originalAmount: 21000, savings: 2000, discount: "Save 10%", displayAmount: "PKR 19,000", detail: "PKR 19,000 for 6 months" },
  year: { key: "year", label: "1 Year", billingPeriod: "year", amount: 37000, originalAmount: 42000, savings: 5000, discount: "Save about 12%", displayAmount: "PKR 37,000", detail: "PKR 37,000 for 1 year" },
};

export async function getSubscription(pharmacyId) {
  const { data, error } = await supabase.from("subscriptions").select("*").eq("pharmacy_id", pharmacyId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function submitPayment({ subscriptionId, pharmacyId, amount, paymentMethod, transactionReference }) {
  const { data, error } = await supabase.from("payment_transactions").insert({ subscription_id: subscriptionId, pharmacy_id: pharmacyId, amount, payment_method: paymentMethod, transaction_reference: transactionReference.trim() }).select().single();
  if (error) throw error;
  return data;
}
