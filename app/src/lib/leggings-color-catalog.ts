/** Standard leggings colour chart (CL 1–48) — admin can load all names at once. */
export type LeggingsColorOption = {
  code: string
  name: string
}

export const LEGGINGS_COLOR_CATALOG: LeggingsColorOption[] = [
  { code: 'CL 1', name: 'Black' },
  { code: 'CL 2', name: 'White' },
  { code: 'CL 3', name: 'Stone / Sandle' },
  { code: 'CL 4', name: 'Navy' },
  { code: 'CL 5', name: 'Red' },
  { code: 'CL 6', name: 'Rani Rose' },
  { code: 'CL 7', name: 'Royal Blue' },
  { code: 'CL 8', name: 'Ramar Green' },
  { code: 'CL 9', name: 'Maroon' },
  { code: 'CL 10', name: 'Flag Green' },
  { code: 'CL 11', name: 'Orange' },
  { code: 'CL 12', name: 'Sky Blue' },
  { code: 'CL 13', name: 'L.Skin' },
  { code: 'CL 14', name: 'Peach / Tomato' },
  { code: 'CL 15', name: 'L.Grey / S.Grey' },
  { code: 'CL 16', name: 'Golden Yellow' },
  { code: 'CL 17', name: 'Cream (O/W)' },
  { code: 'CL 18', name: 'Coffee' },
  { code: 'CL 19', name: 'Mustard' },
  { code: 'CL 20', name: 'Mehandhi' },
  { code: 'CL 21', name: 'Bottle Green' },
  { code: 'CL 22', name: 'Petrol Blue' },
  { code: 'CL 23', name: 'Baby Pink' },
  { code: 'CL 24', name: 'Wine' },
  { code: 'CL 25', name: 'Purple' },
  { code: 'CL 26', name: 'Peacock Green' },
  { code: 'CL 27', name: 'Rust Brown' },
  { code: 'CL 28', name: 'Khaki / D.Skin' },
  { code: 'CL 29', name: 'Red Maroon' },
  { code: 'CL 30', name: 'Parrot Green' },
  { code: 'CL 31', name: 'Olive Green' },
  { code: 'CL 32', name: 'Dark Grey' },
  { code: 'CL 33', name: 'Lemon Yellow' },
  { code: 'CL 34', name: 'Dark Orange' },
  { code: 'CL 35', name: 'Cherry Red' },
  { code: 'CL 36', name: 'Ice Blue' },
  { code: 'CL 37', name: 'Military' },
  { code: 'CL 38', name: 'Light Yellow' },
  { code: 'CL 39', name: 'Lilac' },
  { code: 'CL 40', name: 'Grey Milange' },
  { code: 'CL 41', name: 'Mint Orange' },
  { code: 'CL 42', name: 'Pista Green' },
  { code: 'CL 43', name: 'Ind. Blue' },
  { code: 'CL 44', name: 'Dark Rani' },
  { code: 'CL 45', name: 'Reliance Green' },
  { code: 'CL 46', name: 'Honey' },
  { code: 'CL 47', name: 'Magenta' },
  { code: 'CL 48', name: 'Onion' },
]

/** Colours often marked as in-stock on the supplier chart (upload photos for these first). */
export const LEGGINGS_MARKED_AVAILABLE = new Set([
  'CL 25',
  'CL 29',
  'CL 32',
  'CL 45',
  'CL 47',
])

export function leggingsColorLabel(opt: LeggingsColorOption) {
  return `${opt.code}. ${opt.name}`
}
