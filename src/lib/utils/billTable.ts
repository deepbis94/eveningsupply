import { roundUpAmount, toMoneyAmount } from '@/lib/utils/roundAmount'
import type {
  CustomerBillApiProduct,
  CustomerBillApiRecord,
} from '@/types/CustomerBill'
import type { Product } from '@/types/Product'

export type BilledGroup = {
  customer_group_id: number
  group_name: string
}

export function collectBilledGroups(bills: CustomerBillApiRecord[]): BilledGroup[] {
  const groupMap = new Map<number, BilledGroup>()

  for (const bill of bills) {
    const group = bill.customer?.customer_group
    if (group) {
      groupMap.set(group.customer_group_id, {
        customer_group_id: group.customer_group_id,
        group_name: group.group_name,
      })
    }
  }

  return Array.from(groupMap.values()).sort(
    (a, b) => a.customer_group_id - b.customer_group_id
  )
}

export function collectProductsForTable(
  bills: CustomerBillApiRecord[],
  products: Product[]
): Product[] {
  const productMap = new Map<number, Product>()

  for (const product of products) {
    productMap.set(product.product_id, {
      ...product,
      color: product.color ?? '#ffffff',
    })
  }

  for (const bill of bills) {
    for (const product of bill.products) {
      const productId = Number(product.product_id)
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product_id: productId,
          product_name: product.product_name,
          product_quantity: product.product_quantity,
          order: productId,
          color: '#ffffff',
        })
      }
    }
  }

  return Array.from(productMap.values()).sort((a, b) => a.order - b.order)
}

export function collectProductQuantityTotals(
  bills: CustomerBillApiRecord[]
): Record<number, number> {
  const totals: Record<number, number> = {}

  for (const bill of bills) {
    for (const product of bill.products) {
      const productId = Number(product.product_id)
      totals[productId] = (totals[productId] ?? 0) + Number(product.quantity || 0)
    }
  }

  return totals
}

export function getBillProduct(
  bill: CustomerBillApiRecord,
  productId: number
): CustomerBillApiProduct | undefined {
  return bill.products.find(product => Number(product.product_id) === productId)
}

export function getPreviousDue(bill: CustomerBillApiRecord) {
  return toMoneyAmount(bill.customer?.due_amount ?? 0)
}

export function getCustomerTotalBill(bill: CustomerBillApiRecord) {
  return roundUpAmount(getPreviousDue(bill) + toMoneyAmount(bill.total_bill ?? 0))
}
