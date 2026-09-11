import "server-only";

/**
 * =====================================================================
 * WORKER VERIFICATION (KYC) ARCHITECTURE
 * =====================================================================
 *
 * No real KYC/verification provider (DigiLocker, Signzy, IDfy, etc.) is
 * configured in this phase, and this codebase does NOT fake one — there
 * is no code path anywhere that auto-approves or auto-advances a
 * worker's verification status. A `WorkerVerification` row is created at
 * PENDING when onboarding completes and only ever a human reviewer
 * (through tooling not built yet — no admin dashboard exists) or a real
 * provider integration wired in here would move it to UNDER_REVIEW,
 * VERIFIED, REJECTED, or SUSPENDED.
 *
 * `isConfigured()` reports whether a real provider is wired up, purely
 * so the UI can show an honest "Verification integration pending
 * configuration" message instead of implying something is happening
 * behind the scenes. It also deliberately never touches government ID
 * numbers or document contents — those are never collected or stored by
 * this codebase at all.
 * =====================================================================
 */

export function isVerificationProviderConfigured(): boolean {
  // A real integration would check for its own env vars here, e.g.:
  //   return Boolean(process.env.DIGILOCKER_CLIENT_ID);
  return false;
}
