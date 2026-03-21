import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);

  await prisma.webhookLog.create({
    data: { shop, topic, payload: payloadStr },
  });

  const productId = (payload as Record<string, unknown>)?.id ?? "unknown";

  switch (topic) {
    case "PRODUCTS_CREATE":
      console.log(`[Webhook] Product created in ${shop}:`, productId);
      break;
    case "PRODUCTS_UPDATE":
      console.log(`[Webhook] Product updated in ${shop}:`, productId);
      break;
    case "PRODUCTS_DELETE":
      console.log(`[Webhook] Product deleted in ${shop}:`, productId);
      break;
    default:
      console.log(`[Webhook] Unhandled topic: ${topic}`);
  }

  return new Response("OK", { status: 200 });
};
