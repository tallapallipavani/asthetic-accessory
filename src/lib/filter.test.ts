import { describe, expect, it } from "vitest"
import type { Product } from "../types"
import { filterAndSortProducts, type SortOption } from "./filter"

const products: Product[] = [
  { id: "1", name: "Delicate Pearl Necklace", price: 98, category: "Necklaces", image: null, addedAt: "2026-01-15" },
  { id: "2", name: "18K Gold Twist Ring", price: 148, category: "Rings", image: null, addedAt: "2026-03-10" },
  { id: "3", name: "Crystal Drop Earrings", price: 68, category: "Earrings", image: null, addedAt: "2026-05-20" },
  { id: "4", name: "Layered Chain Bracelet", price: 88, category: "Bracelets", image: null, addedAt: "2026-02-02" },
  { id: "5", name: "Minimalist Hoop Earrings", price: 48, category: "Earrings", image: null, addedAt: "2026-04-25" },
  { id: "6", name: "Beaded Anklet", price: 38, category: "Anklets", image: null, addedAt: "2026-06-01" },
]

const ids = (list: Product[]) => list.map((p) => p.id)

describe("filterAndSortProducts", () => {
  it("returns all products for the All category in original order", () => {
    expect(ids(filterAndSortProducts(products, "All", "", "featured"))).toEqual([
      "1", "2", "3", "4", "5", "6",
    ])
  })

  it("filters by category", () => {
    expect(
      ids(filterAndSortProducts(products, "Earrings", "", "featured")),
    ).toEqual(["3", "5"])
  })

  it("filters by search term in the name (case-insensitive)", () => {
    expect(
      ids(filterAndSortProducts(products, "All", "pearl", "featured")),
    ).toEqual(["1"])
  })

  it("filters by search term in the category", () => {
    expect(
      ids(filterAndSortProducts(products, "All", "anklet", "featured")),
    ).toEqual(["6"])
  })

  it("ignores surrounding whitespace in the search term", () => {
    expect(
      ids(filterAndSortProducts(products, "All", "  NECKLACE  ", "featured")),
    ).toEqual(["1"])
  })

  it("sorts by price ascending", () => {
    expect(
      ids(filterAndSortProducts(products, "All", "", "price-asc" as SortOption)),
    ).toEqual(["6", "5", "3", "4", "1", "2"])
  })

  it("sorts by price descending", () => {
    expect(
      ids(
        filterAndSortProducts(products, "All", "", "price-desc" as SortOption),
      ),
    ).toEqual(["2", "1", "4", "3", "5", "6"])
  })

  it("sorts newest first by addedAt date (not id order)", () => {
    expect(
      ids(filterAndSortProducts(products, "All", "", "newest" as SortOption)),
    ).toEqual(["6", "3", "5", "2", "4", "1"])
  })

  it("keeps featured (original) order when sorting is featured", () => {
    expect(
      ids(filterAndSortProducts(products, "Necklaces", "", "featured")),
    ).toEqual(["1"])
  })

  it("combines category, search, and sort", () => {
    const result = filterAndSortProducts(
      products,
      "Earrings",
      "hoop",
      "price-desc" as SortOption,
    )
    expect(ids(result)).toEqual(["5"])
  })

  it("returns an empty array when nothing matches", () => {
    expect(
      ids(filterAndSortProducts(products, "All", "titanium", "featured")),
    ).toEqual([])
  })

  it("does not mutate the input products array", () => {
    const input = [...products]
    filterAndSortProducts(input, "All", "", "price-desc" as SortOption)
    expect(input.map((p) => p.id)).toEqual(["1", "2", "3", "4", "5", "6"])
  })
})