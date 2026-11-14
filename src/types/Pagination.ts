export type Pagination = {
  total: number
  per_page: number
  current_page: number
  last_page: number
  from: number
  to: number
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: Pagination
  message?: string
}

export const emptyPagination: Pagination = {
  total: 0,
  per_page: 10,
  current_page: 1,
  last_page: 1,
  from: 0,
  to: 0,
}
