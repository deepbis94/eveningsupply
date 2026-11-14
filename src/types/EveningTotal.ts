export type EveningTotalProductSummary = {
  product_id: string
  product_name: string
  product_quantity: string
  total_quantity: number
  total_product_amount: number
}

export type EveningTotalGroupSummary = {
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
    updated_at: string | null
  }
  products: EveningTotalProductSummary[]
}

export type EveningTotalSummary = {
  groups: EveningTotalGroupSummary[]
  grand_totals: EveningTotalProductSummary[]
}
