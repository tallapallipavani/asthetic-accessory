import { describe, expect, it } from "vitest"
import { FLAT_SHIPPING, FREE_SHIPPING_MIN } from "./currency"
import { PRODUCTS } from "../data"
import type { CartItem, Reward } from "../types"
import {
  addFreeItems,
  applyPrize,
  discountTotal,
  grandTotal,
  hasFreeShipping,
  rewardSummary,
  shippingCost,
} from "./rewards"

const ringProduct = PRODUCTS.find((p) => p.name === "18K Gold Twist Ring")!

function reward(partial: Partial<Reward>): Reward {
  return {
    id: "r1",
    kind: "discount",
    label: "Test Reward",
    icon: "🎁",
    ...partial,
  }
}

describe("applyPrize", () => {
  it("applies 10% off the current cart total for '10% Off Next'", () => {
    const { rewards, freeItems } = applyPrize(
      { icon: "💫", label: "10% Off Next" },
      520,
    )
    expect(rewards).toEqual([
      expect.objectContaining({
        kind: "discount",
        label: "10% Off Next",
        value: 52,
      }),
    ])
    expect(freeItems).toEqual([])
  })

  it("rounds the discount to cents", () => {
    const { rewards } = applyPrize({ icon: "💫", label: "10% Off Next" }, 137.33)
    expect(rewards[0].value).toBe(13.73)
  })

  it("applies free shipping", () => {
    const { rewards } = applyPrize({ icon: "🚚", label: "Free Shipping" }, 50)
    expect(rewards).toEqual([
      expect.objectContaining({ kind: "free-shipping", label: "Free Shipping" }),
    ])
  })

  it("records the free ring reward and a $0 free item", () => {
    const { rewards, freeItems } = applyPrize({ icon: "💍", label: "Free Ring" }, 600)
    expect(rewards).toEqual([
      expect.objectContaining({ kind: "free-item", label: "Free Ring" }),
    ])
    expect(freeItems).toEqual([{ name: "18K Gold Twist Ring", price: 0 }])
  })

  it("applies gift wrapping", () => {
    const { rewards } = applyPrize({ icon: "🎁", label: "Gift Wrapping" }, 100)
    expect(rewards).toEqual([
      expect.objectContaining({ kind: "gift-wrapping", label: "Gift Wrapping" }),
    ])
  })

  it("awards 300 points for 'Points ×3'", () => {
    const { rewards } = applyPrize({ icon: "⭐", label: "Points ×3" }, 100)
    expect(rewards).toEqual([
      expect.objectContaining({ kind: "points", label: "Points ×3", value: 300 }),
    ])
  })

  it("falls back to gift-wrapping for unknown prizes", () => {
    const { rewards } = applyPrize({ icon: "❓", label: "Mystery" }, 100)
    expect(rewards[0].kind).toBe("gift-wrapping")
  })
})

describe("addFreeItems", () => {
  it("adds the free ring at the given price", () => {
    const cart: CartItem[] = []
    const result = addFreeItems(
      cart,
      [{ name: "18K Gold Twist Ring", price: 0 }],
      PRODUCTS,
    )
    expect(result).toEqual([{ ...ringProduct, price: 0, quantity: 1 }])
  })

  it("skips items already in the cart", () => {
    const cart: CartItem[] = [{ ...ringProduct, quantity: 1 }]
    expect(
      addFreeItems(cart, [{ name: "18K Gold Twist Ring", price: 0 }], PRODUCTS),
    ).toEqual(cart)
  })

  it("ignores unknown product names", () => {
    const cart: CartItem[] = []
    expect(addFreeItems(cart, [{ name: "Mystery Piece", price: 0 }], PRODUCTS)).toEqual([])
  })
})

describe("reward totals", () => {
  it("sums discount values", () => {
    const rewards = [
      reward({ kind: "discount", value: 10 }),
      reward({ kind: "discount", value: 5.5 }),
      reward({ kind: "points", value: 300 }),
    ]
    expect(discountTotal(rewards)).toBe(15.5)
  })

  it("returns 0 when there are no discounts", () => {
    expect(discountTotal([reward({ kind: "points", value: 300 })])).toBe(0)
  })

  it("detects free shipping rewards", () => {
    expect(hasFreeShipping([reward({ kind: "free-shipping" })])).toBe(true)
    expect(hasFreeShipping([reward({ kind: "discount", value: 10 })])).toBe(false)
  })

  it("charges shipping below the free-shipping minimum without a reward", () => {
    expect(shippingCost(FREE_SHIPPING_MIN - 100, [])).toBe(FLAT_SHIPPING)
  })

  it("waives shipping at the free-shipping minimum or more", () => {
    expect(shippingCost(FREE_SHIPPING_MIN, [])).toBe(0)
    expect(shippingCost(FREE_SHIPPING_MIN + 100, [])).toBe(0)
  })

  it("waives shipping with a free-shipping reward even below the minimum", () => {
    expect(shippingCost(100, [reward({ kind: "free-shipping" })])).toBe(0)
  })

  it("computes the grand total as subtotal minus discount plus shipping", () => {
    const rewards = [reward({ kind: "discount", value: 20 })]
    expect(grandTotal(FREE_SHIPPING_MIN - 200, rewards)).toBe(
      FREE_SHIPPING_MIN - 200 - 20 + FLAT_SHIPPING,
    )
  })

  it("never goes negative on the discounted subtotal", () => {
    const rewards = [reward({ kind: "discount", value: 500 })]
    expect(grandTotal(100, rewards)).toBe(0 + FLAT_SHIPPING)
  })

  it("joins reward labels into a summary", () => {
    const rewards = [
      reward({ kind: "discount", label: "10% Off Next" }),
      reward({ kind: "free-shipping", label: "Free Shipping" }),
    ]
    expect(rewardSummary(rewards)).toBe("10% Off Next + Free Shipping")
  })
})