export type CustomerBillProduct = {
  product_name: string
  product_quantity: string
  quantity: string | number
  product_id: string | number
  rate: number
  product_total: number
}

export type CustomerBill = {
  customer_id: number
  products: CustomerBillProduct[]
  due_paid: number
  total_bill: number
  total_amount: number
  payment: number
  created_date_at: string
  pay_status: boolean
}

export type CustomerBillBulkPayload = {
  bills: CustomerBill[]
}

export type CustomerBillApiProduct = {
  quantity: string | number
  product_id: string | number
  product_name: string
  product_total: number
  product_quantity: string
  rate?: number
}

export type CustomerBillApiRecord = {
  customer_bill_id: number
  customer_id: number
  products: CustomerBillApiProduct[]
  due_paid: number
  total_bill: number
  total_amount: number
  payment: number
  balance: number
  pay_status: boolean
  created_date_at: string
  created_at: string
  updated_at: string
  customer?: {
    customer_id: number
    customer_group_id: number
    customer_name: string
    due_amount?: number
    customer_group?: {
      customer_group_id: number
      group_name: string
      priority?: number
      position?: number
      is_visible?: boolean
      visible?: boolean
      deleted?: boolean
    }
  }
}

export type CustomerBillDateRangeParams = {
  startDate: string
  endDate: string
  perPage: number
  page: number
}

export type CustomerBillDateRangeExportParams = {
  startDate: string
  endDate: string
}

export type DeleteCustomerBillDateRangePayload = {
  start_date: string
  end_date: string
}

export type DeleteCustomerBillDateRangeResult = {
  deleted: number
  start_date: string
  end_date: string
}

export type UpdatePaymentStatusBill = {
  customer_bill_id: number
  payment: number
  pay_status: boolean
  balance?: number
}

export type UpdatePaymentStatusBulkPayload = {
  bills: UpdatePaymentStatusBill[]
}
