export interface CustomerGroup {
  customer_group_id: number
  group_name: string
  priority?: number
  position: number
  visible: boolean
  deleted: boolean
  created_at: string | null
  updated_at: string | null
}
