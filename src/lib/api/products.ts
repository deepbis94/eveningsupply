import { apiClient } from '@/lib/api/client'
import { formatRateValue } from '@/lib/utils/roundAmount'
import type { ApiResponse } from '@/types/ApiResponse'
import type { PaginatedResponse } from '@/types/Pagination'
import type { Product } from '@/types/Product'

type ProductSearchParams = {
  page: number
  perPage: number
  q?: string
}

export async function getVisibleProducts() {
  const res = await apiClient.get<ApiResponse<unknown[]>>('/products-evening/visible')
  return (res.data?.data ?? []).map(mapApiProduct)
}

export async function getProducts(params: ProductSearchParams) {
  const endpoint = params.q ? '/products-evening/search' : '/products-evening'
  const res = await apiClient.get<PaginatedResponse<unknown>>(endpoint, {
    params: {
      page: params.page,
      per_page: params.perPage,
      q: params.q || undefined,
    },
  })

  return {
    ...res.data,
    data: (res.data?.data ?? []).map(mapApiProduct),
  }
}

export async function createProduct(payload: unknown) {
  return apiClient.post('/products-evening', payload)
}

export async function updateProduct(productId: number, payload: unknown) {
  return apiClient.put(`/products-evening/${productId}`, payload)
}

export async function deleteProduct(productId: number) {
  return apiClient.delete(`/products-evening/${productId}`)
}

export async function getProduct(productId: number) {
  const res = await apiClient.get(`/products-evening/${productId}`)
  return res.data
}

export async function exportProductsCsv() {
  return apiClient.get('/products-evening/export-csv', { responseType: 'blob' })
}

export async function importProductsCsv(
  formData: FormData,
  mode: 'upsert' | 'reset' = 'upsert'
) {
  formData.set('mode', mode)
  return apiClient.post('/products-evening/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

function mapApiProduct(product: any): Product {
  const rate = formatRateValue(product.product_rate ?? 0)

  return {
    ...product,
    product_id: product.product_id,
    id: product.product_id,
    product_name: product.product_name,
    name: product.product_name,
    product_quantity: product.product_quantity,
    quantity: product.product_quantity,
    order: product.p_order ?? product.order ?? product.product_id,
    product_rate: rate,
    printed_rate: rate,
    whole_sales_rate: rate,
    basic_rate: rate,
    extra_rate: rate,
    color: product.color ?? '#ffffff',
    is_visible:
      product.is_visible == true || product.is_visible === 'Yes' ? 'Yes' : 'No',
    created_at: product.created_at ?? null,
    updated_at: product.updated_at ?? null,
  }
}
