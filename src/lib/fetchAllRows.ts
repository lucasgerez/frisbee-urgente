// PostgREST caps responses at a max row count (db-max-rows, default 1000).
// Any unfiltered/large query must paginate through .range() or it silently
// truncates, dropping the newest rows when ordered ascending by created_at.
const PAGE_SIZE = 1000

export async function fetchAllRows<T>(
  queryPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = []
  let from = 0
  while (true) {
    const { data, error } = await queryPage(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const page = data ?? []
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return rows
}
