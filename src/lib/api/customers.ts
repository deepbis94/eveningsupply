import { apiClient } from '@/lib/api/client'
import { formatRateValue } from '@/lib/utils/roundAmount'
import type { EveningCustomer } from '@/types/EveningCustomer'
import type { PaginatedResponse } from '@/types/Pagination'

type CustomerSearchParams = {
  page: number
  perPage?: number
  q?: string
  customerGroupId?: number
}

export async function getEveningCustomers(params: CustomerSearchParams) {
  const endpoint = params.q ? '/customers-evening/search' : '/customers-evening'
  const res = await apiClient.get<PaginatedResponse<unknown>>(endpoint, {
    params: {
      page: params.page,
      per_page: params.perPage || undefined,
      q: params.q || undefined,
      customer_group_id: params.customerGroupId || undefined,
    },
  })

  return {
    ...res.data,
    data: (res.data?.data ?? []).map(mapEveningCustomer),
  }
}

export async function createEveningCustomer(payload: unknown) {
  return apiClient.post('/customers-evening', payload)
}

export async function updateEveningCustomer(customerId: number, payload: unknown) {
  return apiClient.put(`/customers-evening/${customerId}`, payload)
}

export async function deleteEveningCustomer(customerId: number) {
  return apiClient.delete(`/customers-evening/${customerId}`)
}

export async function exportEveningCustomersCsv() {
  return apiClient.get('/customers-evening/export-csv', { responseType: 'blob' })
}

export async function importEveningCustomersCsv(
  formData: FormData,
  mode: 'upsert' | 'reset' = 'upsert'
) {
  formData.set('mode', mode)
  return apiClient.post('/customers-evening/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function bulkAssignEveningCustomers(payload: {
  customerGroupId: number
  ids: number[]
}) {
  return apiClient.post('/customers-evening/bulk-assign', {
    customer_group_id: payload.customerGroupId,
    ids: payload.ids,
  })
}

function mapEveningCustomer(customer: any): EveningCustomer {
  return {
    customer_id: customer.customer_id,
    customer_name: customer.customer_name,
    group: customer.customer_group?.group_name ?? '',
    customer_group_id:
      customer.customer_group?.customer_group_id ?? customer.customer_group_id ?? null,
    due: formatRateValue(customer.due_amount ?? 0),
    created_at: customer.created_at,
    updated_at: customer.updated_at,
  }
}
