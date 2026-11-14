import { apiClient } from '@/lib/api/client'
import type { ApiResponse } from '@/types/ApiResponse'
import type { Company } from '@/types/Company'

export async function getFirstCompanyInfo() {
  const res = await apiClient.get<ApiResponse<Company | null>>('/company-info/first')
  return res.data?.data ?? null
}

export async function updateCompanyInfo(companyId: number, payload: unknown) {
  return apiClient.put(`/company-info/${companyId}`, payload)
}
