import { apiClient } from '@/lib/api/client'
import { formatRateValue } from '@/lib/utils/roundAmount'
import type { CustomerBillApiRecord, CustomerBillBulkPayload } from '@/types/CustomerBill'
import type { GroupWithCustomers } from '@/types/GroupWithCustomers'
import type { Product } from '@/types/Product'

export async function loadEveningSales() {
  const [productRes, customerRes] = await Promise.all([
    apiClient.get('/products-evening/visible'),
    apiClient.get('/customers-evening/active/group-wise'),
  ])

  const products = (productRes.data?.data ?? []).map((product: any) => {
    const rate = formatRateValue(product.product_rate ?? 0)
    const productId = Number(product.product_id)

    return {
      ...product,
      product_id: productId,
      product_name: product.product_name,
      product_quantity: product.product_quantity,
      order: Number(product.p_order ?? product.order ?? productId),
      product_rate: rate,
      // Evening products use a single product_rate; mirror it onto legacy rate fields
      // so shared sales UI that still reads whole_sales/basic/extra/printed stays valid.
      whole_sales_rate: rate,
      basic_rate: rate,
      extra_rate: rate,
      printed_rate: rate,
      color: product.color ?? '#ffffff',
      is_visible:
        product.is_visible == true || product.is_visible === 'Yes' ? 'Yes' : 'No',
    }
  })

  const groups = ((customerRes.data?.data ?? []) as GroupWithCustomers[])
    .map(group => ({
      ...group,
      customer_group_id: Number(group.customer_group_id),
      position: Number(group.position ?? 0),
      customers: (group.customers ?? [])
        .map(customer => {
          const customerId = Number(
            (customer as { customer_id?: number; id?: number }).customer_id ??
              (customer as { id?: number }).id
          )
          if (!Number.isFinite(customerId)) {
            return null
          }

          const dueRaw =
            (customer as { due?: number | string; due_amount?: number | string })
              .due_amount ?? customer.due

          return {
            ...customer,
            customer_id: customerId,
            customer_group_id: Number(
              customer.customer_group_id ?? group.customer_group_id
            ),
            due: dueRaw == null || dueRaw === '' ? 0 : Number(dueRaw) || 0,
          }
        })
        .filter((customer): customer is NonNullable<typeof customer> => customer !== null),
    }))
    .sort((a, b) => a.position - b.position)

  return {
    products: products as Product[],
    groups,
  }
}

export async function loadGroupBills(customerGroupId: number) {
  const res = await apiClient.get(
    `/customer-bills-evening/current-date/customer-group/${customerGroupId}`
  )
  return (res.data?.data ?? []) as CustomerBillApiRecord[]
}

/** POST /customer-bills-evening/bulk — Bulk create/update evening bills */
export async function saveEveningBillsBulk(payload: CustomerBillBulkPayload) {
  return apiClient.post('/customer-bills-evening/bulk', payload, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
}
