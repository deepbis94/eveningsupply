export interface Product {
  product_id: number
  id?: number
  product_name: string
  name?: string
  product_quantity: string
  quantity?: string
  order: number
  product_rate?: number | string
  printed_rate?: number | string
  whole_sales_rate?: number | string
  basic_rate?: number | string
  extra_rate?: number | string
  is_visible?: string
  color?: string
  created_at?: string | null
  updated_at?: string | null
}
