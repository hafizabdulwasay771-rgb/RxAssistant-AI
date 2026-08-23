import { getCurrentProfile } from "@/services/appService";

const endpoints = {
  expiry: import.meta.env.VITE_N8N_EXPIRY_WEBHOOK_URL,
  inventory: import.meta.env.VITE_N8N_INVENTORY_WEBHOOK_URL,
  sales: import.meta.env.VITE_N8N_SALES_WEBHOOK_URL,
  analytics: import.meta.env.VITE_N8N_ANALYTICS_WEBHOOK_URL,
  alert: import.meta.env.VITE_N8N_ALERT_WEBHOOK_URL,
};

async function triggerWorkflow(channel, event, payload = {}) {
  const url = endpoints[channel];
  if (!url) return { queued: false, reason: "Webhook not configured" };

  let pharmacyId = payload.pharmacy_id || null;
  if (!pharmacyId) {
    try {
      pharmacyId = (await getCurrentProfile()).pharmacy_id;
    } catch {
      // The frontend operation already succeeded; a future webhook can be retried separately.
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      pharmacy_id: pharmacyId,
      entity_id: payload.entity_id || null,
      data: payload.data || {},
    }),
  });

  if (!response.ok) throw new Error("Automation webhook returned " + response.status);
  return { queued: true };
}

export const triggerExpiryWorkflow = (event, payload) => triggerWorkflow("expiry", event, payload);
export const triggerInventoryWorkflow = (event, payload) => triggerWorkflow("inventory", event, payload);
export const triggerSalesWorkflow = (event, payload) => triggerWorkflow("sales", event, payload);
export const triggerAnalyticsWorkflow = (event, payload) => triggerWorkflow("analytics", event, payload);
export const triggerAlertWorkflow = (event, payload) => triggerWorkflow("alert", event, payload);