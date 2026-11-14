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
