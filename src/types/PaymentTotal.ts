export type GroupedPaymentTotal = {
  customer_group_id: number
  customer_group?: {
    customer_group_id: number
    group_name: string
    priority: number
    visible: boolean
    deleted: boolean
    position: number
    is_visible: boolean
    created_at: string
    updated_at: string
  }
  total_payment: number
  total_bill: number
}
