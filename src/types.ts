export interface Product {
  id: string
  name: string
  price: number
  category: string
  image: string | null
  tag?: string
  addedAt: string // ISO date — drives the "Newest First" sort
  /** Seller-facing identifier, e.g. "AA-N-001" (optional on demo data). */
  sku?: string
  /** Units available for sale. Undefined = treated as in stock (demo items). */
  stock?: number
}

export interface CartItem extends Product {
  quantity: number
}

/** True when the product has no sellable units left. */
export function isOutOfStock(p: { stock?: number }): boolean {
  return typeof p.stock === "number" && p.stock <= 0
}

export type RewardKind =
  | "discount"
  | "free-shipping"
  | "free-item"
  | "gift-wrapping"
  | "points"

export interface Reward {
  id: string
  kind: RewardKind
  label: string
  icon: string
  value?: number
}

export interface Order {
  number: string
  items: CartItem[]
  rewards: Reward[]
  subtotal: number
  discount: number
  shipping: number
  total: number
}