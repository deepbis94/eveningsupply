'use client'

import type { KeyboardEvent } from 'react'
import { create } from 'zustand'

import {
  loadEveningSales,
  loadGroupBills as fetchGroupBills,
  saveEveningBillsBulk,
} from '@/lib/api/eveningSales'
import { roundUpAmount, toMoneyAmount } from '@/lib/utils/roundAmount'
import type {
  CustomerBill,
  CustomerBillApiRecord,
  CustomerBillBulkPayload,
} from '@/types/CustomerBill'
import type { Customer } from '@/types/Customer'
import type { Product } from '@/types/Product'
import type { GroupWithCustomers } from '@/types/GroupWithCustomers'

export type StepCustomerRow = {
  customer: Customer
  groupId: number
  serial: number
  row: number
}

type EveningSalesState = {
  products: Product[]
  groups: GroupWithCustomers[]
  currentStepIndex: number
  skippedSteps: number[]
  grid: Record<number, Record<number, number>>
  groupTotals: Record<number, Record<number, number>>
  finalTotals: Record<number, number>
  customerGroupMap: Record<number, number>
  loading: boolean
  stepLoading: boolean
  loaded: boolean
  saving: boolean

  getQuantity: (customerId: number, productId: number) => number
  getCurrentGroup: () => GroupWithCustomers | null
  getTotalSteps: () => number
  getIsFirstStep: () => boolean
  getIsLastStep: () => boolean
  getStepLabel: () => string
  getIsCurrentStepSkipped: () => boolean
  getStepCustomerRows: () => StepCustomerRow[]

  load: () => Promise<void>
  save: () => Promise<void>
  updateQuantity: (customerId: number, productId: number, newValue: number) => void
  updateGroupTotal: (groupId: number, productId: number, newValue: number) => void
  recalcAllTotals: () => void
  nextStep: () => Promise<void>
  prevStep: () => Promise<void>
  skipStep: () => Promise<void>
  goToStep: (index: number) => Promise<void>
  loadGroupBills: (groupId: number) => Promise<void>
  reloadCurrentGroupBills: () => Promise<void>
  handleKeyDown: (e: KeyboardEvent, row: number, col: number) => void
  setInputRef: (el: HTMLInputElement | null, row: number, col: number) => void
}

/** Input refs kept outside Zustand to avoid serializing DOM nodes. */
let inputRefs: HTMLInputElement[][] = []

function resetInputRefs() {
  inputRefs = []
}

export const useEveningSalesStore = create<EveningSalesState>((set, get) => {
  function getQuantity(customerId: number, productId: number): number {
    return get().grid[Number(customerId)]?.[Number(productId)] ?? 0
  }

  function getCurrentGroup(): GroupWithCustomers | null {
    const { groups, currentStepIndex } = get()
    return groups[currentStepIndex] ?? null
  }

  function getTotalSteps(): number {
    return get().groups.length
  }

  function getIsFirstStep(): boolean {
    return get().currentStepIndex === 0
  }

  function getIsLastStep(): boolean {
    const total = getTotalSteps()
    return total === 0 || get().currentStepIndex >= total - 1
  }

  function getStepLabel(): string {
    const group = getCurrentGroup()
    const total = getTotalSteps()

    if (!group || total === 0) {
      return ''
    }

    return `Step ${get().currentStepIndex + 1} of ${total}: ${group.group_name}`
  }

  function getIsCurrentStepSkipped(): boolean {
    return get().skippedSteps.includes(get().currentStepIndex)
  }

  function getStepCustomerRows(): StepCustomerRow[] {
    const group = getCurrentGroup()
    if (!group) {
      return []
    }

    return group.customers.map((customer, index) => ({
      customer,
      groupId: group.customer_group_id,
      serial: index + 1,
      row: index,
    }))
  }

  function initTotals(
    groups: GroupWithCustomers[],
    products: Product[]
  ): {
    groupTotals: Record<number, Record<number, number>>
    finalTotals: Record<number, number>
  } {
    const groupTotals: Record<number, Record<number, number>> = {}
    const finalTotals: Record<number, number> = {}

    for (const group of groups) {
      groupTotals[group.customer_group_id] = {}
      for (const product of products) {
        groupTotals[group.customer_group_id][product.product_id] = 0
      }
    }

    for (const product of products) {
      finalTotals[product.product_id] = 0
    }

    return { groupTotals, finalTotals }
  }

  function buildCustomerGroupMap(
    groups: GroupWithCustomers[]
  ): Record<number, number> {
    const map: Record<number, number> = {}

    for (const group of groups) {
      const groupId = Number(group.customer_group_id)
      for (const customer of group.customers) {
        const customerId = Number(customer.customer_id)
        if (Number.isFinite(customerId) && Number.isFinite(groupId)) {
          map[customerId] = groupId
        }
      }
    }

    return map
  }

  function clearGroupFromGrid(
    grid: Record<number, Record<number, number>>,
    groups: GroupWithCustomers[],
    groupId: number
  ): Record<number, Record<number, number>> {
    const targetGroupId = Number(groupId)
    const group = groups.find(g => Number(g.customer_group_id) === targetGroupId)
    if (!group) {
      return grid
    }

    const next = { ...grid }
    for (const customer of group.customers) {
      delete next[Number(customer.customer_id)]
    }
    return next
  }

  function syncCustomerDueFromBill(
    groups: GroupWithCustomers[],
    bill: CustomerBillApiRecord
  ): GroupWithCustomers[] {
    const dueAmount = bill.customer?.due_amount
    if (dueAmount === undefined) {
      return groups
    }

    let changed = false
    const roundedDue = roundUpAmount(dueAmount)

    const billCustomerId = Number(bill.customer_id)
    const nextGroups = groups.map(group => {
      const customerIndex = group.customers.findIndex(
        c => Number(c.customer_id) === billCustomerId
      )
      if (customerIndex === -1) {
        return group
      }

      const customer = group.customers[customerIndex]
      if (customer.due === roundedDue) {
        return group
      }

      changed = true
      const customers = [...group.customers]
      customers[customerIndex] = { ...customer, due: roundedDue }
      return { ...group, customers }
    })

    return changed ? nextGroups : groups
  }

  function applyBillsToGrid(
    grid: Record<number, Record<number, number>>,
    groups: GroupWithCustomers[],
    bills: CustomerBillApiRecord[]
  ): {
    grid: Record<number, Record<number, number>>
    groups: GroupWithCustomers[]
  } {
    let nextGrid = { ...grid }
    let nextGroups = groups

    for (const bill of bills) {
      nextGroups = syncCustomerDueFromBill(nextGroups, bill)

      const customerId = Number(bill.customer_id)
      if (!Number.isFinite(customerId)) {
        continue
      }

      const customerProducts = { ...(nextGrid[customerId] ?? {}) }

      for (const product of bill.products) {
        const productId = Number(product.product_id)
        const qty = Number(product.quantity) || 0

        if (Number.isFinite(productId) && qty > 0) {
          customerProducts[productId] = qty
        }
      }

      nextGrid = {
        ...nextGrid,
        [customerId]: customerProducts,
      }
    }

    return { grid: nextGrid, groups: nextGroups }
  }

  function computeTotals(
    groups: GroupWithCustomers[],
    products: Product[],
    grid: Record<number, Record<number, number>>
  ): {
    groupTotals: Record<number, Record<number, number>>
    finalTotals: Record<number, number>
  } {
    const { groupTotals, finalTotals } = initTotals(groups, products)

    for (const group of groups) {
      for (const customer of group.customers) {
        for (const product of products) {
          const val = grid[customer.customer_id]?.[product.product_id] ?? 0
          groupTotals[group.customer_group_id][product.product_id] += val
          finalTotals[product.product_id] += val
        }
      }
    }

    return { groupTotals, finalTotals }
  }

  function getProductRate(product: Product): number {
    const rate =
      product.product_rate ??
      product.basic_rate ??
      product.whole_sales_rate ??
      product.extra_rate ??
      0
    const numeric = Number(rate)
    return Number.isFinite(numeric) ? numeric : 0
  }

  function getCurrentDateString(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function toPayload(): CustomerBillBulkPayload {
    const { grid, groups, products } = get()
    const bills: CustomerBill[] = []
    const createdDate = getCurrentDateString()

    const customerLookup = new Map<number, Customer>()
    for (const group of groups) {
      for (const customer of group.customers) {
        const customerId = Number(customer.customer_id)
        if (Number.isFinite(customerId)) {
          customerLookup.set(customerId, customer)
        }
      }
    }

    const productLookup = new Map<number, Product>()
    for (const product of products) {
      const productId = Number(product.product_id)
      if (Number.isFinite(productId)) {
        productLookup.set(productId, product)
      }
    }

    for (const [customerIdStr, productQuantities] of Object.entries(grid)) {
      const customerId = Number(customerIdStr)
      if (!Number.isFinite(customerId)) {
        continue
      }

      const customer = customerLookup.get(customerId)
      const billProducts: CustomerBill['products'] = []
      let totalBill = 0

      for (const [productIdStr, qtyValue] of Object.entries(productQuantities)) {
        const qty = Number(qtyValue)
        if (!Number.isFinite(qty) || qty <= 0) {
          continue
        }

        const productId = Number(productIdStr)
        const product = productLookup.get(productId)
        if (!product) {
          continue
        }

        const rate = getProductRate(product)
        const productTotal = toMoneyAmount(rate * qty)

        billProducts.push({
          product_name: product.product_name,
          product_quantity: String(product.product_quantity ?? ''),
          quantity: qty,
          product_id: productId,
          rate,
          product_total: productTotal,
        })

        totalBill += productTotal
      }

      if (billProducts.length === 0) {
        continue
      }

      const totalAmount = toMoneyAmount(totalBill)
      const payment = 0
      const duePaid = roundUpAmount(customer?.due ?? 0)

      bills.push({
        customer_id: customerId,
        products: billProducts,
        due_paid: duePaid,
        total_bill: totalAmount,
        total_amount: totalAmount,
        payment,
        created_date_at: createdDate,
        pay_status: payment >= totalAmount ? true : false,
      })
    }

    return { bills }
  }

  return {
    products: [],
    groups: [],
    currentStepIndex: 0,
    skippedSteps: [],
    grid: {},
    groupTotals: {},
    finalTotals: {},
    customerGroupMap: {},
    loading: false,
    stepLoading: false,
    loaded: false,
    saving: false,

    getQuantity,
    getCurrentGroup,
    getTotalSteps,
    getIsFirstStep,
    getIsLastStep,
    getStepLabel,
    getIsCurrentStepSkipped,
    getStepCustomerRows,

    async loadGroupBills(groupId: number) {
      set({ stepLoading: true })

      try {
        const bills = await fetchGroupBills(groupId)
        const { groups, products, grid } = get()

        const clearedGrid = clearGroupFromGrid(grid, groups, groupId)
        const applied = applyBillsToGrid(clearedGrid, groups, bills)
        const totals = computeTotals(applied.groups, products, applied.grid)

        set({
          grid: applied.grid,
          groups: applied.groups,
          groupTotals: totals.groupTotals,
          finalTotals: totals.finalTotals,
        })
      } finally {
        set({ stepLoading: false })
      }
    },

    async load() {
      const { loaded, loading } = get()
      if (loaded || loading) {
        return
      }

      set({ loading: true })

      try {
        const res = await loadEveningSales()
        const { groupTotals, finalTotals } = initTotals(res.groups, res.products)

        resetInputRefs()

        set({
          products: res.products,
          groups: res.groups,
          currentStepIndex: 0,
          skippedSteps: [],
          grid: {},
          groupTotals,
          finalTotals,
          customerGroupMap: buildCustomerGroupMap(res.groups),
          loaded: true,
        })

        if (res.groups.length > 0) {
          await get().loadGroupBills(res.groups[0].customer_group_id)
        }
      } finally {
        set({ loading: false })
      }
    },

    async goToStep(index: number) {
      if (index < 0 || index >= getTotalSteps()) {
        return
      }

      resetInputRefs()
      set({ currentStepIndex: index })

      const group = get().groups[index]
      if (group) {
        await get().loadGroupBills(group.customer_group_id)
      }
    },

    async nextStep() {
      if (!getIsLastStep()) {
        await get().goToStep(get().currentStepIndex + 1)
      }
    },

    async prevStep() {
      if (!getIsFirstStep()) {
        await get().goToStep(get().currentStepIndex - 1)
      }
    },

    async skipStep() {
      const { currentStepIndex, skippedSteps } = get()

      if (!skippedSteps.includes(currentStepIndex)) {
        set({ skippedSteps: [...skippedSteps, currentStepIndex] })
      }

      if (!getIsLastStep()) {
        await get().nextStep()
      }
    },

    updateQuantity(customerId: number, productId: number, newValue: number) {
      const cid = Number(customerId)
      const pid = Number(productId)
      const qty = Number(newValue) || 0

      const oldValue = getQuantity(cid, pid)
      if (qty === oldValue) {
        return
      }

      const { grid, groupTotals, finalTotals, customerGroupMap } = get()
      const customerProducts = { ...(grid[cid] ?? {}) }
      customerProducts[pid] = qty

      const nextGrid = { ...grid, [cid]: customerProducts }
      const diff = qty - oldValue
      const groupId = Number(customerGroupMap[cid])

      const nextGroupTotals = { ...groupTotals }
      if (Number.isFinite(groupId)) {
        nextGroupTotals[groupId] = {
          ...(groupTotals[groupId] ?? {}),
          [pid]: (groupTotals[groupId]?.[pid] ?? 0) + diff,
        }
      }

      const nextFinalTotals = {
        ...finalTotals,
        [pid]: (finalTotals[pid] ?? 0) + diff,
      }

      set({
        grid: nextGrid,
        groupTotals: nextGroupTotals,
        finalTotals: nextFinalTotals,
      })
    },

    updateGroupTotal(groupId: number, productId: number, newValue: number) {
      const gid = Number(groupId)
      const pid = Number(productId)
      const qty = Number(newValue) || 0

      const { groups, groupTotals } = get()
      const group = groups.find(g => Number(g.customer_group_id) === gid)
      if (!group || group.customers.length === 0) {
        return
      }

      const oldValue = groupTotals[gid]?.[pid] ?? 0
      const diff = qty - oldValue
      if (diff === 0) {
        return
      }

      // Keep save payload in sync: adjust the first customer so `grid` changes.
      const targetId = Number(group.customers[0].customer_id)
      const current = getQuantity(targetId, pid)
      get().updateQuantity(targetId, pid, Math.max(0, current + diff))
    },

    recalcAllTotals() {
      const { groups, products, grid } = get()
      const totals = computeTotals(groups, products, grid)
      set({
        groupTotals: totals.groupTotals,
        finalTotals: totals.finalTotals,
      })
    },

    handleKeyDown(e: KeyboardEvent, row: number, col: number) {
      let r = row
      let c = col

      switch (e.key) {
        case 'ArrowRight':
          c++
          break
        case 'ArrowLeft':
          c--
          break
        case 'ArrowDown':
          r++
          break
        case 'Enter':
          r++
          c = 0
          break
        case 'ArrowUp':
          r--
          break
        default:
          return
      }

      e.preventDefault()

      const el = inputRefs?.[r]?.[c]
      if (el) {
        el.focus()
        el.select()
      }
    },

    setInputRef(el: HTMLInputElement | null, row: number, col: number) {
      if (!el) {
        return
      }

      if (!inputRefs[row]) {
        inputRefs[row] = []
      }

      inputRefs[row][col] = el
    },

    async save() {
      set({ saving: true })

      try {
        const payload = toPayload()

        if (payload.bills.length === 0) {
          throw new Error('No orders to save.')
        }

        // POST /customer-bills-evening/bulk
        await saveEveningBillsBulk(payload)
        await get().reloadCurrentGroupBills()
      } finally {
        set({ saving: false })
      }
    },

    async reloadCurrentGroupBills() {
      const group = getCurrentGroup()
      if (group) {
        await get().loadGroupBills(group.customer_group_id)
      }
    },
  }
})
