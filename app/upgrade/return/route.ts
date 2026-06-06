import { redirect } from "next/navigation";
import { getPayment } from "@/lib/mollie";
import { setProCookie } from "@/lib/upgrade";

/**
 * Mollie redirects the browser here after the judge picks a status on
 * the hosted checkout. We verify the payment status server-side (so the
 * Pro cookie can only be set in response to a real "paid" payment, not
 * by anyone hitting this URL with a made-up id), then redirect to
 * /settings with a banner-driving search param.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    redirect("/settings?upgrade=error");
  }

  let isPaid = false;
  try {
    const payment = await getPayment(id);
    isPaid = payment.status === "paid";
  } catch (err) {
    console.error("[upgrade/return]:", err);
  }

  if (isPaid) {
    await setProCookie();
    redirect("/settings?upgrade=success");
  }

  redirect("/settings?upgrade=canceled");
}
