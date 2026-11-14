'use client'

import { useEveningSalesStore } from '@/stores/eveningSalesStore'
import type { GroupWithCustomers } from '@/types/GroupWithCustomers'

type Props = {
  group: GroupWithCustomers
}

export default function GroupTotalRow({ group }: Props) {
  const products = useEveningSalesStore(s => s.products)
  const groupTotals = useEveningSalesStore(s => s.groupTotals)

  function displayValue(productId: number) {
    const total = groupTotals?.[group.customer_group_id]?.[productId] ?? 0
    return total === 0 ? '' : String(total)
  }

  return (
    <tr className="evening-sales-group-total-row">
      <td />
      <td>
        <strong>{group.group_name} Total</strong>
      </td>
      {products.map(product => (
        <td key={product.product_id} className="text-center">
          <strong>{displayValue(product.product_id)}</strong>
        </td>
      ))}
    </tr>
  )
}
