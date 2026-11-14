export function roundUpAmount(value: number | string | null | undefined): number {
  const numeric = Number(value ?? 0)

  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.ceil(numeric)
}

export function toMoneyAmount(value: number | string | null | undefined): number {
  const numeric = Number(value ?? 0)

  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.round((numeric + Number.EPSILON) * 100) / 100
}

export function formatAmount(value: number | string | null | undefined): string {
  return String(formatRateValue(toMoneyAmount(value).toFixed(2)))
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
