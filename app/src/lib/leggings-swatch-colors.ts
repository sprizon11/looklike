/** Fabric swatch colours for leggings picker (approximate hex from supplier chart). */
const SWATCH_BY_CODE: Record<string, string> = {
  'CL 1': '#1a1a1a',
  'CL 2': '#f7f7f2',
  'CL 3': '#c4a574',
  'CL 4': '#1e3a5f',
  'CL 5': '#d62828',
  'CL 6': '#c71585',
  'CL 7': '#2563eb',
  'CL 8': '#0d9488',
  'CL 9': '#6b1d2a',
  'CL 10': '#16a34a',
  'CL 11': '#ea580c',
  'CL 12': '#38bdf8',
  'CL 13': '#e8c4a8',
  'CL 14': '#e07a5f',
  'CL 15': '#9ca3af',
  'CL 16': '#eab308',
  'CL 17': '#faf3e0',
  'CL 18': '#5c4033',
  'CL 19': '#a16207',
  'CL 20': '#84cc16',
  'CL 21': '#14532d',
  'CL 22': '#0f766e',
  'CL 23': '#fbcfe8',
  'CL 24': '#581c87',
  'CL 25': '#6b21a8',
  'CL 26': '#047857',
  'CL 27': '#9a3412',
  'CL 28': '#a8a29e',
  'CL 29': '#7f1d1d',
  'CL 30': '#4ade80',
  'CL 31': '#3f6212',
  'CL 32': '#374151',
  'CL 33': '#fef08a',
  'CL 34': '#f97316',
  'CL 35': '#be123c',
  'CL 36': '#a5f3fc',
  'CL 37': '#171717',
  'CL 38': '#fef9c3',
  'CL 39': '#a78bfa',
  'CL 40': '#d1d5db',
  'CL 41': '#fda4af',
  'CL 42': '#99f6e4',
  'CL 43': '#1d4ed8',
  'CL 44': '#db2777',
  'CL 45': '#115e59',
  'CL 46': '#78350f',
  'CL 47': '#a21caf',
  'CL 48': '#9d8189',
}

export function leggingsSwatchHex(colorLabel: string): string {
  const code = colorLabel.split('.')[0]?.trim()
  if (code && SWATCH_BY_CODE[code]) return SWATCH_BY_CODE[code]
  return '#d4d4d4'
}

/** Light swatches need a visible border on white backgrounds. */
export function swatchNeedsBorder(hex: string) {
  const light = ['#f7f7f2', '#faf3e0', '#fef08a', '#fef9c3', '#fbcfe8', '#a5f3fc', '#f7f7f7', '#ffffff']
  return light.includes(hex.toLowerCase()) || hex.toLowerCase() === '#f5f5f0'
}
