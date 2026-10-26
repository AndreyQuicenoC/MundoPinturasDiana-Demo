/** Parseo de carga rápida: `SKU - CANTIDAD - costo unitario` separado por comas o saltos de línea. */

export type BulkLine = { sku: string; quantity: number; unitCost?: number }

const splitRows = (raw: string) =>
  raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)

const parseRow = (row: string): BulkLine | string => {
  const parts = row.split(/\s*[-–|]\s*/).map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2) return `Formato inválido: «${row}». Usa SKU - CANTIDAD - costo.`
  const sku = parts[0]
  const quantity = Number(parts[1].replace(/[^\d.,]/g, '').replace(',', '.'))
  if (!sku) return 'SKU vacío.'
  if (!Number.isInteger(quantity) || quantity <= 0) return `Cantidad inválida en «${row}».`
  let unitCost: number | undefined
  if (parts[2]) {
    const c = Number(parts[2].replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!(c >= 0)) return `Costo inválido en «${row}».`
    unitCost = c
  }
  return { sku, quantity, unitCost }
}

export function parseBulkInventoryText(raw: string): { lines: BulkLine[]; errors: string[] } {
  const errors: string[] = []
  const lines: BulkLine[] = []
  for (const row of splitRows(raw)) {
    const parsed = parseRow(row)
    if (typeof parsed === 'string') errors.push(parsed)
    else lines.push(parsed)
  }
  return { lines, errors }
}
