import { ConvexHttpClient } from "convex/browser"
import { useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import { PRODUCTS } from "../data"
import type { Product } from "../types"
import { LS_KEYS, loadLS } from "./persistence"

/**
 * Re-applies the user's persisted photo/price overrides on top of any
 * catalog (static or live from Convex).
 */
export function applyLocalOverrides(base: Product[]): Product[] {
  const savedImages = loadLS<Record<string, string>>(LS_KEYS.productImages, {})
  const savedPrices = loadLS<Record<string, number>>(LS_KEYS.productPrices, {})
  return base.map((p) => {
    const savedImg = savedImages[p.id]
    const savedPrice = savedPrices[p.id]
    return {
      ...p,
      // Only trust persisted data-URL uploads; ignore old blob URLs and empties
      image: savedImg && savedImg.startsWith("data:") ? savedImg : p.image,
      price:
        typeof savedPrice === "number" && savedPrice > 0
          ? savedPrice
          : p.price,
    }
  })
}

/**
 * Live product catalog from Convex. Returns an empty array while loading or
 * when no VITE_CONVEX_URL is configured — the app falls back to the static
 * catalog until live data arrives.
 */
export function useCatalog(): Product[] {
  const [live, setLive] = useState<Product[]>([])

  useEffect(() => {
    const url = import.meta.env.VITE_CONVEX_URL as string | undefined
    if (!url) return
    let cancelled = false
    const client = new ConvexHttpClient(url)
    client
      .query(api.products.list)
      .then((rows) => {
        if (cancelled) return
        type LiveProductRow = {
          _id: string
          name: string
          price: number
          category: string
          tag?: string
          image: string | null
          sku?: string
          stock?: number
          createdAt: number
        }
        const mapped: Product[] = (rows as LiveProductRow[]).map((p) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          category: p.category,
          tag: p.tag,
          image: p.image ?? null,
          sku: p.sku,
          stock: p.stock,
          addedAt: new Date(p.createdAt).toISOString().slice(0, 10),
        }))
        // Only swap in once we actually have data (avoids flashing the empty
        // state before the first response).
        if (mapped.length > 0) setLive(mapped)
      })
      .catch(() => {
        /* backend unreachable — keep the static catalog */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return live
}

export const STATIC_CATALOG = PRODUCTS