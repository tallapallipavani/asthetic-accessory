export interface Product {
  id: string
  name: string
  price: number
  category: string
  image: string | null
  tag?: string
  addedAt: string // ISO date — drives the "Newest First" sort
}

export interface CartItem extends Product {
  quantity: number
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