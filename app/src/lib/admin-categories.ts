const STORAGE_KEY = 'looklike.admin.categories.v1'

export const BUILTIN_CATEGORIES = ['Kurti', 'Leggings', 'Palazzo'] as const

const OTHER_VALUE = 'Other'

function safeParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function getSavedCustomCategories(): string[] {
  const list = safeParse<string[]>(localStorage.getItem(STORAGE_KEY))
  if (!Array.isArray(list)) return []
  return list
    .map((c) => (typeof c === 'string' ? c.trim() : ''))
    .filter((c) => c && !BUILTIN_CATEGORIES.includes(c as (typeof BUILTIN_CATEGORIES)[number]) && c !== OTHER_VALUE)
}

export function rememberCustomCategory(name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  if (BUILTIN_CATEGORIES.includes(trimmed as (typeof BUILTIN_CATEGORIES)[number])) return
  if (trimmed === OTHER_VALUE) return

  const existing = getSavedCustomCategories()
  const key = trimmed.toLowerCase()
  if (existing.some((c) => c.toLowerCase() === key)) return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, trimmed]))
  } catch {
    /* ignore quota */
  }
}

export function buildAdminCategoryOptions(productCategories: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  const add = (label: string) => {
    const t = label.trim()
    if (!t || t === OTHER_VALUE || seen.has(t.toLowerCase())) return
    seen.add(t.toLowerCase())
    out.push(t)
  }

  for (const c of BUILTIN_CATEGORIES) add(c)
  for (const c of getSavedCustomCategories()) add(c)
  for (const c of productCategories) add(c)
  add(OTHER_VALUE)

  return out
}

export function resolveProductCategory(category: string, otherCategoryName: string): string {
  if (category === OTHER_VALUE) return otherCategoryName.trim()
  return category.trim()
}

export { OTHER_VALUE as ADMIN_CATEGORY_OTHER }
