import { apiClient } from '@/lib/api/client'
import type { ApiResponse } from '@/types/ApiResponse'
import type { CustomerGroup } from '@/types/CustomerGroup'

export async function getCustomerGroups() {
  const res = await apiClient.get<ApiResponse<CustomerGroup[]>>(
    '/customer-groups-evening'
  )
  return res.data?.data ?? []
}

export async function getActiveCustomerGroups() {
  const res = await apiClient.get<ApiResponse<CustomerGroup[]>>(
    '/customer-groups-evening/active'
  )
  return res.data?.data ?? []
}

export async function createCustomerGroup(payload: unknown) {
  return apiClient.post('/customer-groups-evening', payload)
}

export async function updateCustomerGroup(customerGroupId: number, payload: unknown) {
  return apiClient.put(`/customer-groups-evening/${customerGroupId}`, payload)
}

export async function deleteCustomerGroup(customerGroupId: number) {
  return apiClient.delete(`/customer-groups-evening/${customerGroupId}`)
}
