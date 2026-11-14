import type { ReactNode } from 'react'

import { getBillProduct } from '@/lib/utils/billTable'
import { formatAmount } from '@/lib/utils/roundAmount'
import type { CustomerBillApiRecord } from '@/types/CustomerBill'
import type { Product } from '@/types/Product'

type Props = {
  bills: CustomerBillApiRecord[]
  products: Product[]
  productQuantityTotals: Record<number, number>
  productColumnsPosition: 'before-summary' | 'after-summary'
  summaryHeaders: ReactNode
  renderSummaryCells: (bill: CustomerBillApiRecord, index: number) => ReactNode
  grandTotalLabelColSpan: number
  emptySummaryFooterCount: number
}

function ProductHeaders({ products }: { products: Product[] }) {
  return (
    <>
      {products.map(product => (
        <th
          key={product.product_id}
          className="product-header"
          style={{ backgroundColor: product.color, minWidth: 90, color: '#000' }}
        >
          {product.product_name}
          <br />({product.product_quantity})
        </th>
      ))}
    </>
  )
}

function ProductCells({
  bill,
  products,
}: {
  bill: CustomerBillApiRecord
  products: Product[]
}) {
  return (
    <>
      {products.map(product => {
        const billProduct = getBillProduct(bill, product.product_id)
        return (
          <td
            key={`${bill.customer_bill_id}-${product.product_id}`}
            className="text-center"
            style={{ backgroundColor: product.color, color: '#000', minWidth: 90 }}
          >
            {billProduct ? (
              <>
                <strong>{billProduct.quantity}</strong>
                <div className="product-total">
                  {formatAmount(billProduct.product_total ?? 0)}
                </div>
              </>
            ) : (
              <span className="text-muted">-</span>
            )}
          </td>
        )
      })}
    </>
  )
}

function ProductFooterCells({
  products,
  productQuantityTotals,
}: {
  products: Product[]
  productQuantityTotals: Record<number, number>
}) {
  return (
    <>
      {products.map(product => (
        <td key={`total-${product.product_id}`} className="text-center fw-bold">
          {productQuantityTotals[product.product_id] ?? 0}
        </td>
      ))}
    </>
  )
}

export default function CustomerBillTable({
  bills,
  products,
  productQuantityTotals,
  productColumnsPosition,
  summaryHeaders,
  renderSummaryCells,
  grandTotalLabelColSpan,
  emptySummaryFooterCount,
}: Props) {
  const productsBeforeSummary = productColumnsPosition === 'before-summary'

  return (
    <div className="table-responsive" style={{ position: 'relative' }}>
      <table className="table table-bordered table-sm">
        <thead>
          <tr>
            <th style={{ width: 60, background: '#e6f2ff' }}>Sl.</th>
            <th style={{ minWidth: 250, background: '#ffe6ff' }}>Customer Name</th>
            <th style={{ minWidth: 140 }}>Group</th>
            {productsBeforeSummary ? <ProductHeaders products={products} /> : null}
            {summaryHeaders}
            {!productsBeforeSummary ? <ProductHeaders products={products} /> : null}
          </tr>
        </thead>
        <tbody>
          {bills.map((bill, index) => (
            <tr key={bill.customer_bill_id}>
              <td className="text-center" style={{ background: '#e6f2ff' }}>
                {index + 1}
              </td>
              <td className="customer-name">
                {bill.customer?.customer_name ?? `Customer #${bill.customer_id}`}
                <div className="text-muted small">Bill #{bill.customer_bill_id}</div>
              </td>
              <td>{bill.customer?.customer_group?.group_name ?? 'No group'}</td>
              {productsBeforeSummary ? (
                <ProductCells bill={bill} products={products} />
              ) : null}
              {renderSummaryCells(bill, index)}
              {!productsBeforeSummary ? (
                <ProductCells bill={bill} products={products} />
              ) : null}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr
            style={{
              position: 'sticky',
              bottom: 0,
              background: '#222',
              color: '#fff',
              fontWeight: 'bold',
              zIndex: 10,
            }}
          >
            <td colSpan={grandTotalLabelColSpan}>
              <b>Grand Total</b>
            </td>
            {productsBeforeSummary ? (
              <ProductFooterCells
                products={products}
                productQuantityTotals={productQuantityTotals}
              />
            ) : null}
            {Array.from({ length: emptySummaryFooterCount }).map((_, index) => (
              <td key={`empty-summary-${index}`} />
            ))}
            {!productsBeforeSummary ? (
              <ProductFooterCells
                products={products}
                productQuantityTotals={productQuantityTotals}
              />
            ) : null}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
