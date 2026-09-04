import { useEffect, useState } from "react"
import type { SortOption } from "./filter"

export interface FilterState {
  category: string
  search: string
  sort: SortOption
}

const DEFAULT_STATE: FilterState = {
  category: "All",
  search: "",
  sort: "featured",
}

const SORT_VALUES: readonly SortOption[] = [
  "featured",
  "price-asc",
  "price-desc",
  "newest",
]

function isSortOption(value: string | null): value is SortOption {
  return value !== null && (SORT_VALUES as readonly string[]).includes(value)
}

function readStateFromUrl(): FilterState {
  const params = new URLSearchParams(window.location.search)
  const category = params.get("category")
  const sort = params.get("sort")
  return {
    category: category && category.trim() !== "" ? category : DEFAULT_STATE.category,
    search: params.get("q") ?? "",
    sort: isSortOption(sort) ? sort : DEFAULT_STATE.sort,
  }
}

/** Keeps category/search/sort synced with the URL (?category=…&q=…&sort=…). */
export function useUrlFilterState() {
  const [state, setState] = useState<FilterState>(readStateFromUrl)

  // Write state to the URL whenever it changes (no history spam while typing).
  useEffect(() => {
    const params = new URLSearchParams()
    if (state.category !== DEFAULT_STATE.category)
      params.set("category", state.category)
    if (state.search.trim() !== "") params.set("q", state.search.trim())
    if (state.sort !== DEFAULT_STATE.sort) params.set("sort", state.sort)

    const query = params.toString()
    const hash = window.location.hash
    const url = query ? `?${query}${hash}` : `${window.location.pathname}${hash}`
    window.history.replaceState(null, "", url)
  }, [state])

  // Keep state in sync if the user navigates back/forward.
  useEffect(() => {
    const onPopState = () => setState(readStateFromUrl())
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  return [state, setState] as const
}