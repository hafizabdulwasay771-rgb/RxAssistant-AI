export function friendlyError(error, fallback = "We could not complete that action. Please try again.") {
  const message = error?.message || "";
  if (/invalid login credentials/i.test(message)) return "Your email or password is incorrect.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email address before signing in.";
  if (/already registered/i.test(message)) return "An account already exists for this email address.";
  if (/row-level security|permission denied/i.test(message)) return "You do not have permission to perform this action."
  if (/already exists|duplicate key|unique constraint/i.test(message)) return "This batch already exists in your pharmacy.";
  if (/network|fetch/i.test(message)) return "We could not reach the service. Check your connection and try again.";
  return fallback;
}

