import createMollieClient, {
  type Payment,
  type MollieClient,
} from "@mollie/api-client";

/**
 * Generic Mollie helper.
 *
 * Reads MOLLIE_API_KEY from the environment. Use a test key (prefixed with
 * `test_`) to create payments in Mollie's test mode. Server-side only.
 */

let client: MollieClient | null = null;

function getClient(): MollieClient {
  if (!process.env.MOLLIE_API_KEY) {
    throw new Error("Missing environment variable: MOLLIE_API_KEY");
  }
  if (!client) {
    client = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
  }
  return client;
}

export interface CreateTestPaymentOptions {
  /** Amount value as a decimal string, e.g. "10.00". */
  value: string;
  /** ISO 4217 currency code. Defaults to "EUR". */
  currency?: string;
  /** Human-readable payment description. */
  description: string;
  /** URL the customer is returned to after the payment flow. */
  redirectUrl: string;
}

/**
 * Create a payment. When MOLLIE_API_KEY is a test key, this creates a test
 * payment that can be completed in Mollie's test mode.
 */
export async function createTestPayment(
  options: CreateTestPaymentOptions,
): Promise<Payment> {
  return getClient().payments.create({
    amount: {
      value: options.value,
      currency: options.currency ?? "EUR",
    },
    description: options.description,
    redirectUrl: options.redirectUrl,
  });
}
