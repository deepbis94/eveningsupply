export interface EveningCustomer {
  customer_id: number
  customer_name: string
  group: string
  customer_group_id: number | null
  due: number | string
  created_at: string | null
  updated_at: string | null
}
