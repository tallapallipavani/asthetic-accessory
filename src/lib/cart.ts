import type { CartItem, Product } from "../types"

/** Units of a product still available for the cart, given its stock. */
export function availableStock(
  product: { stock?: number },
  cart: CartItem[],
): number {
  if (typeof product.stock !== "number") return Infinity // untracked = unlimited
  const inCart = cart
    .filter((i) => i.id === (product as Product).id)
    .reduce((s, i) => s + i.quantity, 0)
  return Math.max(0, product.stock - inCart)
}

export function addCartItem(cart: CartItem[], product: Product): CartItem[] {
  const ex = cart.find((i) => i.id === product.id)
  const next = ex ? ex.quantity + 1 : 1
  if (availableStock(product, cart) <= 0) return cart // sold out / at cap
  if (ex)
    return cart.map((i) =>
      i.id === product.id ? { ...i, quantity: next } : i,
    )
  return [...cart, { ...product, quantity: 1 }]
}

export function removeCartItem(cart: CartItem[], id: string): CartItem[] {
  return cart.filter((i) => i.id !== id)
}

export function updateCartQuantity(
  cart: CartItem[],
  id: string,
  qty: number,
): CartItem[] {
  if (qty <= 0) return removeCartItem(cart, id)
  const line = cart.find((i) => i.id === id)
  if (!line) return cart
  const capped = Math.min(qty, availableStock(line, cart) + line.quantity)
  return cart.map((i) => (i.id === id ? { ...i, quantity: capped } : i))
}

export function cartItemCount(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.quantity, 0)
}

export function cartSubtotal(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.price * i.quantity, 0)
}