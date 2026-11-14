'use client'

import type { ChangeEvent, KeyboardEvent } from 'react'

import { useEveningSalesStore } from '@/stores/eveningSalesStore'
import type { Customer } from '@/types/Customer'

type Props = {
  serial: number
  row: number
  customer: Customer
  groupId: number
}

export default function EveningSalesCustomerRow({
  serial,
  row,
  customer,
}: Props) {
  const products = useEveningSalesStore(s => s.products)
  const customerQtys = useEveningSalesStore(s => s.grid[customer.customer_id])
  const updateQuantity = useEveningSalesStore(s => s.updateQuantity)
  const handleKeyDown = useEveningSalesStore(s => s.handleKeyDown)
  const setInputRef = useEveningSalesStore(s => s.setInputRef)

  function displayValue(productId: number) {
    const qty = customerQtys?.[productId] ?? 0
    return qty === 0 ? '' : String(qty)
  }

  function onQtyInput(event: ChangeEvent<HTMLInputElement>, productId: number) {
    const digitsOnly = event.target.value.replace(/\D/g, '')
    const val = digitsOnly === '' ? 0 : Number(digitsOnly)
    updateQuantity(customer.customer_id, productId, val)
  }

  function onQtyKeyDown(event: KeyboardEvent<HTMLInputElement>, productIndex: number) {
    const navigationKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'Home', 'End']

    if (navigationKeys.includes(event.key) || event.key === 'Enter') {
      handleKeyDown(event, row, productIndex)
      return
    }

    if (controlKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      return
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault()
    }
  }

  return (
    <tr>
      <td className="text-center" style={{ background: '#e6f2ff' }}>
        {serial}
      </td>

      <td className="evening-sales-customer-name">
        {customer.customer_name}
      </td>

      {products.map((product, productIndex) => (
        <td
          key={product.product_id}
        >
          <input
            type="text"
            inputMode="numeric"
            className="form-control form-control-sm text-center evening-sales-qty-input"
            value={displayValue(product.product_id)}
            ref={el => setInputRef(el, row, productIndex)}
            onChange={e => onQtyInput(e, product.product_id)}
            onKeyDown={e => onQtyKeyDown(e, productIndex)}
          />
        </td>
      ))}
    </tr>
  )
}
