import "server-only";

/**
 * =====================================================================
 * OTP PROVIDER ARCHITECTURE
 * =====================================================================
 *
 * `OtpProvider` is the interface any real SMS provider (MSG91, Twilio,
 * Gupshup, etc.) would implement in a later phase, once credentials are
 * available. Swapping providers means adding a new file that implements
 * this interface and changing `getOtpProvider()` below — nothing else in
 * the app needs to change.
 *
 * Because no real OTP provider credentials are available in this phase,
 * ONLY a DEV-ONLY provider is implemented. It never sends a real SMS.
 * It is loud about this everywhere it's used (console log prefix, and a
 * visible "DEV ONLY" banner in the /verify UI) so it can never be
 * mistaken for production behavior.
 * =====================================================================
 */

export interface OtpProvider {
  readonly name: string;
  readonly isDev: boolean;
  sendOtp(phone: string, code: string): Promise<void>;
}

class DevConsoleOtpProvider implements OtpProvider {
  readonly name = "dev-console";
  readonly isDev = true;

  async sendOtp(phone: string, code: string): Promise<void> {
    // DEV ONLY: this "sends" the OTP by logging it to the server console.
    // No real SMS is ever dispatched by this provider. Do not ship this
    // as the production provider — wire up a real SMS gateway first.
    // eslint-disable-next-line no-console
    console.log(
      `[DEV ONLY OTP] phone=${phone} code=${code} — this is NOT a real SMS. ` +
        `Configure a real OTP provider before production launch.`
    );
  }
}

let cachedProvider: OtpProvider | null = null;

export function getOtpProvider(): OtpProvider {
  if (cachedProvider) return cachedProvider;

  // Real providers would be selected here based on env vars, e.g.:
  //   if (process.env.MSG91_API_KEY) return new Msg91OtpProvider(...)
  // None are configured yet, so we always fall back to the dev provider.
  cachedProvider = new DevConsoleOtpProvider();
  return cachedProvider;
}
