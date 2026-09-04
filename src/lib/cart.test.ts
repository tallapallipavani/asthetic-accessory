import { describe, expect, it } from "vitest"
import type { CartItem, Product } from "../types"
import {
  addCartItem,
  cartItemCount,
  cartSubtotal,
  removeCartItem,
  updateCartQuantity,
} from "./cart"

const necklace: Product = {
  id: "1",
  name: "Delicate Pearl Necklace",
  price: 98,
  category: "Necklaces",
  image: null,
  addedAt: "2026-04-12",
}

const ring: Product = {
  id: "2",
  name: "18K Gold Twist Ring",
  price: 148,
  category: "Rings",
  image: null,
  addedAt: "2026-02-14",
}

function item(product: Product, quantity: number): CartItem {
  return { ...product, quantity }
}

describe("addCartItem", () => {
  it("adds a new product with quantity 1", () => {
    const result = addCartItem([], necklace)
    expect(result).toEqual([item(necklace, 1)])
  })

  it("increments the quantity of an existing product", () => {
    const cart = [item(necklace, 2)]
    const result = addCartItem(cart, necklace)
    expect(result).toEqual([item(necklace, 3)])
  })

  it("keeps other products untouched", () => {
    const cart = [item(necklace, 1), item(ring, 1)]
    const result = addCartItem(cart, necklace)
    expect(result).toEqual([item(necklace, 2), item(ring, 1)])
  })

  it("does not mutate the input cart", () => {
    const cart = [item(necklace, 1)]
    addCartItem(cart, necklace)
    expect(cart).toEqual([item(necklace, 1)])
  })
})

describe("removeCartItem", () => {
  it("removes the matching item", () => {
    const cart = [item(necklace, 1), item(ring, 2)]
    expect(removeCartItem(cart, "1")).toEqual([item(ring, 2)])
  })

  it("returns the same cart when the id is missing", () => {
    const cart = [item(necklace, 1)]
    expect(removeCartItem(cart, "99")).toEqual([item(necklace, 1)])
  })
})

describe("updateCartQuantity", () => {
  it("sets the new quantity", () => {
    const cart = [item(necklace, 1)]
    expect(updateCartQuantity(cart, "1", 4)).toEqual([item(necklace, 4)])
  })

  it("removes the item when quantity drops to 0", () => {
    const cart = [item(necklace, 1), item(ring, 1)]
    expect(updateCartQuantity(cart, "1", 0)).toEqual([item(ring, 1)])
  })

  it("removes the item on negative quantities", () => {
    const cart = [item(necklace, 1)]
    expect(updateCartQuantity(cart, "1", -2)).toEqual([])
  })

  it("ignores unknown ids", () => {
    const cart = [item(necklace, 1)]
    expect(updateCartQuantity(cart, "99", 3)).toEqual([item(necklace, 1)])
  })
})

describe("cartItemCount", () => {
  it("sums quantities across items", () => {
    expect(cartItemCount([item(necklace, 2), item(ring, 3)])).toBe(5)
  })

  it("returns 0 for an empty cart", () => {
    expect(cartItemCount([])).toBe(0)
  })
})

describe("cartSubtotal", () => {
  it("multiplies price by quantity", () => {
    const cart = [item({ ...necklace, price: 10 }, 2), item(ring, 3)]
    expect(cartSubtotal(cart)).toBe(20 + 148 * 3)
  })

  it("returns 0 for an empty cart", () => {
    expect(cartSubtotal([])).toBe(0)
  })
})