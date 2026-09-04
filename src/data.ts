import type { Product } from "./types"

export const NAV_LINKS = [
  { label: "Collections", href: "#products" },
  { label: "New Arrivals", href: "#products" },
  { label: "Bestsellers", href: "#products" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#about" },
]

export const CATEGORIES = [
  "All",
  "Necklaces",
  "Rings",
  "Earrings",
  "Bracelets",
  "Anklets",
]

export const PRIZES = [
  { label: "Gift Wrapping", icon: "🎁", color: "#C8973A", textColor: "#fff" },
  { label: "10% Off Next", icon: "💫", color: "#1C1208", textColor: "#C8973A" },
  { label: "Free Shipping", icon: "🚚", color: "#6B4E35", textColor: "#fff" },
  { label: "Free Ring", icon: "💍", color: "#3A2010", textColor: "#C8973A" },
  { label: "Points ×3", icon: "⭐", color: "#8B5E3C", textColor: "#fff" },
]

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Delicate Pearl Necklace",
    price: 4999,
    category: "Necklaces",
    image:
      "https://images.unsplash.com/photo-1631982686092-e6561a853187?w=600&q=80&auto=format&fit=crop",
    tag: "Bestseller",
    sku: "AA-N-001",
    stock: 15,
    addedAt: "2026-04-12",
  },
  {
    id: "2",
    name: "18K Gold Twist Ring",
    price: 8999,
    category: "Rings",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80&auto=format&fit=crop",
    sku: "AA-R-002",
    stock: 8,
    addedAt: "2026-02-14",
  },
  {
    id: "3",
    name: "Crystal Drop Earrings",
    price: 3499,
    category: "Earrings",
    image:
      "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80&auto=format&fit=crop",
    tag: "New",
    sku: "AA-E-003",
    stock: 20,
    addedAt: "2026-08-20",
  },
  {
    id: "4",
    name: "Layered Chain Bracelet",
    price: 4499,
    category: "Bracelets",
    image:
      "https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=600&q=80&auto=format&fit=crop",
    sku: "AA-B-004",
    stock: 12,
    addedAt: "2026-01-20",
  },
  {
    id: "5",
    name: "Minimalist Hoop Earrings",
    price: 2499,
    category: "Earrings",
    image:
      "https://images.pexels.com/photos/13081070/pexels-photo-13081070.jpeg?auto=compress&cs=tinysrgb&w=600",
    sku: "AA-E-005",
    stock: 0, // deliberately out of stock to exercise the flow
    addedAt: "2026-05-30",
  },
  {
    id: "6",
    name: "Beaded Anklet",
    price: 1999,
    category: "Anklets",
    image:
      "https://images.pexels.com/photos/20192867/pexels-photo-20192867.jpeg?auto=compress&cs=tinysrgb&w=600",
    tag: "New",
    sku: "AA-A-006",
    stock: 25,
    addedAt: "2026-08-10",
  },
  {
    id: "7",
    name: "Vintage Locket Necklace",
    price: 12999,
    category: "Necklaces",
    image:
      "https://images.unsplash.com/photo-1491349174775-aaafddd81942?w=600&q=80&auto=format&fit=crop",
    sku: "AA-N-007",
    stock: 6,
    addedAt: "2025-12-05",
  },
  {
    id: "8",
    name: "Diamond Tennis Bracelet",
    price: 28999,
    category: "Bracelets",
    image:
      "https://images.pexels.com/photos/8891958/pexels-photo-8891958.jpeg?auto=compress&cs=tinysrgb&w=600",
    tag: "Premium",
    sku: "AA-B-008",
    stock: 4,
    addedAt: "2026-07-28",
  },
  {
    id: "9",
    name: "Moonstone Pendant",
    price: 7999,
    category: "Necklaces",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80&auto=format&fit=crop",
    sku: "AA-N-009",
    stock: 10,
    addedAt: "2026-03-25",
  },
  {
    id: "10",
    name: "Twisted Gold Bangle",
    price: 15999,
    category: "Bracelets",
    image:
      "https://images.pexels.com/photos/20493839/pexels-photo-20493839.jpeg?auto=compress&cs=tinysrgb&w=600",
    sku: "AA-B-010",
    stock: 7,
    addedAt: "2026-06-18",
  },
  {
    id: "11",
    name: "Sapphire Stud Earrings",
    price: 18999,
    category: "Earrings",
    image:
      "https://images.pexels.com/photos/5370643/pexels-photo-5370643.jpeg?auto=compress&cs=tinysrgb&w=600",
    tag: "Premium",
    sku: "AA-E-011",
    stock: 5,
    addedAt: "2026-07-05",
  },
  {
    id: "12",
    name: "Infinity Anklet",
    price: 2999,
    category: "Anklets",
    image:
      "https://images.pexels.com/photos/12564237/pexels-photo-12564237.jpeg?auto=compress&cs=tinysrgb&w=600",
    sku: "AA-A-012",
    stock: 18,
    addedAt: "2026-05-02",
  },
]
