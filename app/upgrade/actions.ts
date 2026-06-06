"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createTestPayment } from "@/lib/mollie";

/**
 * Kick off a Mollie test-mode upgrade. Creates a €9.99 payment with a
 * redirectUrl pointing at /upgrade/return, then redirects the browser to
 * Mollie's hosted checkout. The judge picks a status on the test page;
 * Mollie returns them to /upgrade/return where we verify and (if paid)
 * set the Pro cookie.
 */
export async function startUpgrade(): Promise<void> {
  let checkoutUrl: string | null = null;

  try {
    const h = await headers();
    const host =
      h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "https";
    const redirectUrl = `${proto}://${host}/upgrade/return`;

    const payment = await createTestPayment({
      value: "9.99",
      description: "StudyFrisker Pro",
      redirectUrl,
    });
    checkoutUrl = payment.getCheckoutUrl();
  } catch (err) {
    console.error("[upgrade/startUpgrade]:", err);
  }

  // redirect() throws an internal NEXT_REDIRECT — never inside a try/catch
  // (the catch would swallow it). Both branches below exit the function.
  if (!checkoutUrl) {
    redirect("/settings?upgrade=error");
  }
  redirect(checkoutUrl);
}
