import { FLAT_SHIPPING, FREE_SHIPPING_MIN } from "./currency"
import type { CartItem, Product, Reward } from "../types"

export interface Prize {
  icon: string
  label: string
}

export interface FreeItem {
  name: string
  price: number
}

export function discountTotal(rewards: Reward[]): number {
  return rewards
    .filter((r) => r.kind === "discount")
    .reduce((s, r) => s + (r.value ?? 0), 0)
}

export function hasFreeShipping(rewards: Reward[]): boolean {
  return rewards.some((r) => r.kind === "free-shipping")
}

export function shippingCost(total: number, rewards: Reward[]): number {
  return hasFreeShipping(rewards) || total >= FREE_SHIPPING_MIN ? 0 : FLAT_SHIPPING
}

export function grandTotal(total: number, rewards: Reward[]): number {
  return (
    Math.max(0, total - discountTotal(rewards)) + shippingCost(total, rewards)
  )
}

export function rewardSummary(rewards: Reward[]): string {
  return rewards.map((r) => r.label).join(" + ")
}

function makeReward(
  prize: Prize,
  kind: Reward["kind"],
  label: string,
  value?: number,
): Reward {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    label,
    icon: prize.icon,
    value,
  }
}

/**
 * Translates a won prize into order rewards plus any free items to drop
 * into the cart (e.g. the free ring).
 */
export function applyPrize(
  prize: Prize,
  cartTotal: number,
): { rewards: Reward[]; freeItems: FreeItem[] } {
  switch (prize.label) {
    case "10% Off Next":
      return {
        rewards: [
          makeReward(
            prize,
            "discount",
            prize.label,
            Math.round(cartTotal * 0.1 * 100) / 100,
          ),
        ],
        freeItems: [],
      }
    case "Free Shipping":
      return {
        rewards: [makeReward(prize, "free-shipping", prize.label)],
        freeItems: [],
      }
    case "Free Ring":
      return {
        rewards: [makeReward(prize, "free-item", prize.label)],
        freeItems: [{ name: "18K Gold Twist Ring", price: 0 }],
      }
    case "Gift Wrapping":
      return {
        rewards: [makeReward(prize, "gift-wrapping", prize.label)],
        freeItems: [],
      }
    case "Points ×3":
      return {
        rewards: [makeReward(prize, "points", prize.label, 300)],
        freeItems: [],
      }
    default:
      return {
        rewards: [makeReward(prize, "gift-wrapping", prize.label)],
        freeItems: [],
      }
  }
}

/**
 * Adds free items (at their given price) to the cart, skipping duplicates.
 * Products are matched by name against the current catalog so the reward
 * keeps working regardless of database ids.
 */
export function addFreeItems(
  cart: CartItem[],
  items: FreeItem[],
  catalog: Product[],
): CartItem[] {
  let next = cart
  for (const item of items) {
    if (next.some((i) => i.name === item.name)) continue
    const product = catalog.find((p) => p.name === item.name)
    if (product) next = [...next, { ...product, price: item.price, quantity: 1 }]
  }
  return next
}