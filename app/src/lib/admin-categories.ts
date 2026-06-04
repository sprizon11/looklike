const STORAGE_KEY = 'looklike.admin.categories.v1'

export const BUILTIN_CATEGORIES = ['Kurti', 'Leggings', 'Palazzo'] as const

/** Select value — not saved as a real category name. */
export const ADMIN_CATEGORY_ADD_NEW = '__add_new__'

const LEGACY_OTHER_VALUE = 'Other'

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
    .filter(
      (c) =>
        c &&
        !BUILTIN_CATEGORIES.includes(c as (typeof BUILTIN_CATEGORIES)[number]) &&
        c !== ADMIN_CATEGORY_ADD_NEW &&
        c !== LEGACY_OTHER_VALUE
    )
}

export function rememberCustomCategory(name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  if (BUILTIN_CATEGORIES.includes(trimmed as (typeof BUILTIN_CATEGORIES)[number])) return
  if (trimmed === ADMIN_CATEGORY_ADD_NEW || trimmed === LEGACY_OTHER_VALUE) return

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
    if (!t || t === ADMIN_CATEGORY_ADD_NEW || t === LEGACY_OTHER_VALUE || seen.has(t.toLowerCase())) return
    seen.add(t.toLowerCase())
    out.push(t)
  }

  for (const c of BUILTIN_CATEGORIES) add(c)
  for (const c of getSavedCustomCategories()) add(c)
  for (const c of productCategories) add(c)

  return out
}

export function isAddNewCategorySelection(category: string): boolean {
  return category === ADMIN_CATEGORY_ADD_NEW || category === LEGACY_OTHER_VALUE
}

export function categoryOptionLabel(option: string): string {
  if (isAddNewCategorySelection(option)) return '+ Add new category…'
  return option
}

export function normalizeNewCategoryName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return null
  if (isAddNewCategorySelection(trimmed)) return null
  if (BUILTIN_CATEGORIES.includes(trimmed as (typeof BUILTIN_CATEGORIES)[number])) {
    return trimmed
  }
  return trimmed
}

export function resolveProductCategory(category: string, otherCategoryName: string): string {
  if (isAddNewCategorySelection(category)) return otherCategoryName.trim()
  return category.trim()
}

/** @deprecated Use ADMIN_CATEGORY_ADD_NEW */
export const ADMIN_CATEGORY_OTHER = ADMIN_CATEGORY_ADD_NEW
