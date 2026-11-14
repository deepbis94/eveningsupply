import { apiClient } from '@/lib/api/client'
import type { ApiResponse } from '@/types/ApiResponse'
import type {
  CustomerBillApiRecord,
  CustomerBillBulkPayload,
  CustomerBillDateRangeExportParams,
  CustomerBillDateRangeParams,
  DeleteCustomerBillDateRangePayload,
  DeleteCustomerBillDateRangeResult,
  UpdatePaymentStatusBulkPayload,
} from '@/types/CustomerBill'
import type { EveningTotalSummary } from '@/types/EveningTotal'
import type { PaginatedResponse } from '@/types/Pagination'
import type { GroupedPaymentTotal } from '@/types/PaymentTotal'

export async function getCurrentDateBills() {
  const res = await apiClient.get<ApiResponse<CustomerBillApiRecord[]>>(
    '/customer-bills-evening/current-date'
  )
  return res.data?.data ?? []
}

export async function getYesterdayDateBills() {
  const res = await apiClient.get<ApiResponse<CustomerBillApiRecord[]>>(
    '/customer-bills-evening/yesterday-date'
  )
  return res.data?.data ?? []
}

export async function getCurrentDateBillsByGroup(customerGroupId: number) {
  const res = await apiClient.get<ApiResponse<CustomerBillApiRecord[]>>(
    `/customer-bills-evening/current-date/customer-group/${customerGroupId}`
  )
  return res.data?.data ?? []
}

export async function searchCurrentDateBills(customerName: string) {
  const res = await apiClient.get<ApiResponse<CustomerBillApiRecord[]>>(
    '/customer-bills-evening/current-date/search',
    { params: { q: customerName } }
  )
  return res.data?.data ?? []
}

export async function getBillsByDateRange(params: CustomerBillDateRangeParams) {
  const res = await apiClient.get<PaginatedResponse<CustomerBillApiRecord>>(
    '/customer-bills-evening/date-range',
    {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        per_page: params.perPage,
        page: params.page,
      },
    }
  )
  return res.data
}

export async function saveEveningSales(payload: CustomerBillBulkPayload) {
  return apiClient.post('/customer-bills-evening/bulk', payload)
}

export async function updateYesterdayPaymentStatuses(
  payload: UpdatePaymentStatusBulkPayload
) {
  return apiClient.post(
    '/customer-bills-evening/yesterday-date/payment-status/bulk',
    payload
  )
}

export async function deleteCustomerBill(customerBillId: number) {
  return apiClient.delete(`/customer-bills-evening/${customerBillId}`)
}

export async function deleteCustomerBillsByDateRange(
  payload: DeleteCustomerBillDateRangePayload
) {
  const res = await apiClient.delete<
    ApiResponse<DeleteCustomerBillDateRangeResult>
  >('/customer-bills-evening/date-range', { data: payload })
  return res.data
}

export async function exportBillsByDateRangeCsv(
  params: CustomerBillDateRangeExportParams
) {
  return apiClient.get('/customer-bills-evening/date-range/export-csv', {
    params: { start_date: params.startDate, end_date: params.endDate },
    responseType: 'blob',
  })
}

export async function exportBillsByDateRangePdf(
  params: CustomerBillDateRangeExportParams
) {
  return apiClient.get('/customer-bills-evening/date-range/export-pdf', {
    params: { start_date: params.startDate, end_date: params.endDate },
    responseType: 'blob',
  })
}

export async function getCurrentGroupPrintPdf(customerGroupId: number) {
  return apiClient.get(
    `/customer-bills-evening/current-date/customer-group/${customerGroupId}/print`,
    { responseType: 'blob' }
  )
}

export async function getEveningTotalPrintPdf() {
  return apiClient.get('/customer-bills-evening/current-date/daily-total/print', {
    responseType: 'blob',
  })
}

export async function getCurrentProductSummaryByGroup() {
  const res = await apiClient.get<ApiResponse<EveningTotalSummary>>(
    '/customer-bills-evening/current-date/product-summary-by-customer-group'
  )
  return res.data?.data
}

export async function getYesterdayGroupedByCustomerGroup(date: string) {
  const res = await apiClient.get<ApiResponse<GroupedPaymentTotal[]>>(
    '/customer-bills-evening/yesterday-date/grouped-by-customer-group',
    { params: { date } }
  )
  return res.data?.data ?? []
}
