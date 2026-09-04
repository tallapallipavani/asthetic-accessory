import type { Product } from "../types"

export type SortOption = "featured" | "price-asc" | "price-desc" | "newest"

export function filterAndSortProducts(
  products: Product[],
  activeCategory: string,
  search: string,
  sortBy: SortOption,
): Product[] {
  const q = search.trim().toLowerCase()
  let list =
    activeCategory === "All"
      ? [...products]
      : products.filter((p) => p.category === activeCategory)
  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
  }
  switch (sortBy) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price)
      break
    case "price-desc":
      list.sort((a, b) => b.price - a.price)
      break
    case "newest":
      // ISO dates compare correctly as strings
      list.sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      break
  }
  return list
}