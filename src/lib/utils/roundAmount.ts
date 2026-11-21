export function toMoneyAmount(value: number | string | null | undefined): number {
  if (value == null || value === '') {
    return 0
  }

  const numeric = Number(typeof value === 'string' ? value.trim() : value)

  if (!Number.isFinite(numeric)) {
    return 0
  }

  return numeric
}

function amountText(value: number | string): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  // Drop binary float noise (10.1 + 20.2) without changing a real decimal.
  return String(Number(value.toPrecision(12)))
}

export function formatAmount(value: number | string | null | undefined): string {
  if (value == null || value === '') {
    return '0'
  }

  const raw = amountText(value)
  if (raw === '' || raw === '.' || !Number.isFinite(Number(raw))) {
    return '0'
  }

  return String(formatRateValue(raw))
}

export function formatRateValue(
  value: number | string | null | undefined
): number | string {
  if (value == null || value === '') {
    return 0
  }

  const str = String(value).trim()
  if (str.endsWith('.00')) {
    return str.slice(0, -3)
  }

  return value
}
