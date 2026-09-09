import { useMemo, useState } from 'react'

// Client-side search + pagination for a list of items.
// `matches(item, lowerCaseQuery)` should return true when the item matches.
export function usePagedList(items, matches) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => matches(it, q))
  }, [items, query, matches])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const paged = filtered.slice(offset, offset + pageSize)

  return {
    query, setQuery,
    page: current, setPage,
    pageSize, setPageSize,
    total: filtered.length,
    paged, offset,
  }
}
