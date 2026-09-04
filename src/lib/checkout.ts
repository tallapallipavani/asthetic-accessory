import { ConvexHttpClient } from "convex/browser"
import type { Id } from "../../convex/_generated/dataModel"
import { api } from "../../convex/_generated/api"

export interface CustomerDetails {
  name: string
  email: string
  phone?: string
  address?: string
}

export interface OrderLine {
  name: string
  price: number
  quantity: number
}

export interface PlaceOrderInput {
  items: OrderLine[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  customer: CustomerDetails
}

export interface PlacedOrder {
  id: Id<"orders">
  number: string
}

let client: ConvexHttpClient | null = null

function getClient(): ConvexHttpClient {
  const url = import.meta.env.VITE_CONVEX_URL as string | undefined
  if (!url) throw new Error("Backend is not configured")
  client ??= new ConvexHttpClient(url)
  return client
}

/**
 * Records the order as paid via the demo path. When Razorpay keys are
 * configured this switches to the real createOrder + verifyPayment flow.
 */export async function placeDemoOrder(
  input: PlaceOrderInput,
  method: string,
): Promise<PlacedOrder> {
  return getClient().mutation(api.orders.demoPay, { ...input, method })
}

/**
 * Stores a newsletter signup. Returns "subscribed" for a new address or
 * "already" when that email is on the list.
 */
export async function subscribeToNewsletter(
  email: string,
): Promise<"subscribed" | "already"> {
  const result = await getClient().mutation(api.subscribers.subscribe, { email })
  return result.status
}
