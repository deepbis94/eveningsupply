export function formatDisplayDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}

export function getTodayLabel() {
  return formatDisplayDate(new Date())
}

export function getYesterdayLabel() {
  const date = new Date()
  date.setDate(date.getDate() - 1)

  return formatDisplayDate(date)
}

export function getDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getTodayDateInputValue() {
  return getDateInputValue(new Date())
}

export function getYesterdayDateInputValue() {
  const date = new Date()
  date.setDate(date.getDate() - 1)

  return getDateInputValue(date)
}

export function formatDateInputLabel(dateInput: string) {
  if (!dateInput) {
    return ''
  }

  const [year, month, day] = dateInput.split('-')

  if (!year || !month || !day) {
    return dateInput
  }

  return `${day}-${month}-${year}`
}

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function formatUpdatedAtTitle(value: string | null | undefined) {
  const date = parseDate(value)
  if (!date) {
    return undefined
  }

  return `${formatDisplayDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function formatShortUpdatedAt(value: string | null | undefined) {
  const date = parseDate(value)
  if (!date) {
    return '—'
  }

  const now = new Date()
  const hours = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (sameDay) {
    return hours
  }

  const month = date.toLocaleString('en-GB', { month: 'short' })
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getDate()} ${month}`
  }

  return `${date.getDate()} ${month} ${String(date.getFullYear()).slice(-2)}`
}
