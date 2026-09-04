import type { CartItem, Product } from "../types"

export function addCartItem(cart: CartItem[], product: Product): CartItem[] {
  const ex = cart.find((i) => i.id === product.id)
  if (ex)
    return cart.map((i) =>
      i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
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
  return cart.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
}

export function cartItemCount(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.quantity, 0)
}

export function cartSubtotal(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.price * i.quantity, 0)
}