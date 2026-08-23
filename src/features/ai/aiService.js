const roadmap = [
  { id: "stock_forecast", title: "Stock forecasting", description: "Forecasting will use completed sales and inventory transaction history." },
  { id: "reorder_recommendations", title: "Reorder recommendations", description: "Recommendations will use configured stock thresholds, sales velocity, and supplier data." },
  { id: "expiry_risk", title: "Expiry-risk analysis", description: "Risk analysis will use medicine batches, quantities, and configurable expiry windows." },
  { id: "sales_trends", title: "Sales-trend analysis", description: "Trend analysis will use completed sales and sale items." },
  { id: "anomaly_detection", title: "Anomaly detection", description: "Anomaly detection will operate on verified, historical operational data." },
];

export function getAiRoadmap() {
  return roadmap.map((feature) => ({ ...feature, status: "coming_with_ai_automation" }));
}

export function getAiReadiness() {
  return {
    status: "foundation_ready",
    message: "Coming with AI Automation",
    dataSources: ["medicines", "sales", "sale_items", "inventory_transactions", "alerts", "app_settings"],
  };
}