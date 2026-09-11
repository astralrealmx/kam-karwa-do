import "server-only";

/**
 * =====================================================================
 * PAYOUT PROVIDER ARCHITECTURE
 * =====================================================================
 *
 * Mirrors the OTP provider pattern (src/lib/auth/otpProvider.ts): a real
 * payout provider (Razorpay Route, Cashfree Payouts, Decentro, etc.)
 * would implement `PayoutProvider` in its own file and get selected in
 * `getPayoutProvider()` once credentials exist. Nothing else in the app
 * would need to change.
 *
 * Because no real payout provider is configured, only a DEV-ONLY
 * provider is implemented. Critically, it NEVER persists the raw account
 * number/IFSC the worker types in — it computes a masked label and an
 * opaque reference token and immediately discards the raw input. This is
 * true regardless of provider in this codebase: the onboarding API route
 * only ever calls `linkAccount()` and stores its return value, never the
 * raw request body fields themselves.
 * =====================================================================
 */

export interface PayoutAccountInput {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
}

export interface PayoutLinkResult {
  provider: string;
  accountRef: string;
  maskedLabel: string;
}

export interface PayoutProvider {
  readonly name: string;
  readonly isDev: boolean;
  linkAccount(input: PayoutAccountInput): Promise<PayoutLinkResult>;
}

class DevPayoutProvider implements PayoutProvider {
  readonly name = "dev-manual";
  readonly isDev = true;

  async linkAccount(input: PayoutAccountInput): Promise<PayoutLinkResult> {
    // DEV ONLY: does not call any real payout gateway and does not
    // persist input.accountNumber or input.ifsc anywhere. It only ever
    // returns a masked label (last 4 digits) and a random opaque
    // reference — the caller stores exactly these two values, nothing
    // else.
    const last4 = input.accountNumber.replace(/\D/g, "").slice(-4) || "0000";
    const accountRef = `dev_${Math.random().toString(36).slice(2, 12)}`;

    return {
      provider: this.name,
      accountRef,
      maskedLabel: `${input.accountHolderName.split(" ")[0] || "Account"} •••• ${last4}`,
    };
  }
}

let cachedProvider: PayoutProvider | null = null;

export function getPayoutProvider(): PayoutProvider {
  if (cachedProvider) return cachedProvider;

  // A real provider would be selected here based on env vars, e.g.:
  //   if (process.env.RAZORPAY_ROUTE_KEY) return new RazorpayPayoutProvider(...)
  // None are configured yet.
  cachedProvider = new DevPayoutProvider();
  return cachedProvider;
}
