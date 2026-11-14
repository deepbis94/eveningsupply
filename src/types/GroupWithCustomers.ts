import type { Customer } from './Customer'

export interface GroupWithCustomers {
  customer_group_id: number
  group_name: string
  position: number
  customers: Customer[]
}
