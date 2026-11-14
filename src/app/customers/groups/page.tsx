'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import CommonModal from '@/components/shared/CommonModal'
import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import PageHeader from '@/components/shared/PageHeader'
import {
  createCustomerGroup,
  deleteCustomerGroup,
  getCustomerGroups,
  updateCustomerGroup,
} from '@/lib/api/customerGroups'
import {
  bulkAssignEveningCustomers,
  getEveningCustomers,
} from '@/lib/api/customers'
import { toast } from '@/lib/utils/toast'
import type { CustomerGroup } from '@/types/CustomerGroup'
import type { EveningCustomer } from '@/types/EveningCustomer'

export default function CustomerGroupsPage() {
  const [groups, setGroups] = useState<CustomerGroup[]>([])
  const [groupSearch, setGroupSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<CustomerGroup | null>(null)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [groupIdToDelete, setGroupIdToDelete] = useState<number | null>(null)
  const [groupMode, setGroupMode] = useState<'add' | 'edit'>('add')
  const [groupForm, setGroupForm] = useState({
    group_name: '',
    position: 0,
    visible: true,
  })
  const [groupErrors, setGroupErrors] = useState({ group_name: '' })

  const [showMembersModal, setShowMembersModal] = useState(false)
  const [membersGroup, setMembersGroup] = useState<CustomerGroup | null>(null)
  const [members, setMembers] = useState<EveningCustomer[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  const [showMoveStep, setShowMoveStep] = useState(false)
  const [moveTargetGroupId, setMoveTargetGroupId] = useState<number | ''>('')
  const [assigning, setAssigning] = useState(false)

  const [addSearch, setAddSearch] = useState('')
  const [addResults, setAddResults] = useState<EveningCustomer[]>([])
  const [selectedAddIds, setSelectedAddIds] = useState<number[]>([])
  const [addSearching, setAddSearching] = useState(false)
  const [addSearchAttempted, setAddSearchAttempted] = useState(false)

  const filteredGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase()
    if (!q) return groups
    return groups.filter(
      group =>
        String(group.customer_group_id).includes(q) ||
        group.group_name.toLowerCase().includes(q)
    )
  }, [groups, groupSearch])

  const moveTargets = useMemo(
    () =>
      groups.filter(
        group => group.customer_group_id !== membersGroup?.customer_group_id
      ),
    [groups, membersGroup]
  )

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true)
      setGroups(await getCustomerGroups())
    } catch (err) {
      console.error('Failed to load customer groups', err)
      toast.error('Failed to load customer groups')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchGroups()
  }, [fetchGroups])

  function openGroupModal(mode: 'add' | 'edit', group: CustomerGroup | null = null) {
    setGroupMode(mode)
    if (mode === 'edit' && group) {
      setSelectedGroup(group)
      setGroupForm({
        group_name: group.group_name,
        position: group.position,
        visible: group.visible,
      })
    } else {
      setSelectedGroup(null)
      setGroupForm({ group_name: '', position: 0, visible: true })
    }
    setGroupErrors({ group_name: '' })
    setShowGroupModal(true)
  }

  function closeGroupModal() {
    setShowGroupModal(false)
  }

  function openDeleteModal(groupId: number | undefined) {
    if (groupId == null) return
    setGroupIdToDelete(groupId)
    setShowDeleteModal(true)
  }

  function closeDeleteModal() {
    setShowDeleteModal(false)
    setTimeout(() => setGroupIdToDelete(null), 300)
  }

  async function confirmDeleteGroup() {
    const id = groupIdToDelete
    if (id == null) return

    try {
      await deleteCustomerGroup(id)
      setGroups(prev => prev.filter(group => group.customer_group_id !== id))
      toast.success('Customer group deleted')
      closeDeleteModal()
    } catch (err) {
      console.error('Failed to delete customer group', err)
      toast.error('Failed to delete customer group')
    }
  }

  function validateGroupName(name = groupForm.group_name) {
    const error = name.trim() ? '' : 'Group name is required'
    setGroupErrors({ group_name: error })
    return error
  }

  async function saveGroup() {
    const nameError = validateGroupName()
    if (nameError) {
      toast.error('Please fix group validation errors')
      return
    }

    try {
      if (groupMode === 'add') {
        const res = await createCustomerGroup({
          group_name: groupForm.group_name,
          priority: 1,
          position: groupForm.position,
          visible: groupForm.visible,
          deleted: false,
        })
        const created = (res.data as { data?: CustomerGroup })?.data
        setGroups(prev => [
          created ?? {
            ...groupForm,
            customer_group_id: Date.now(),
            priority: 1,
            deleted: false,
            created_at: null,
            updated_at: null,
          },
          ...prev,
        ])
        toast.success('Customer group added')
      } else if (selectedGroup) {
        const payload = {
          group_name: groupForm.group_name,
          position: groupForm.position,
          visible: groupForm.visible,
        }
        await updateCustomerGroup(selectedGroup.customer_group_id, payload)
        setGroups(prev =>
          prev.map(g =>
            g.customer_group_id === selectedGroup.customer_group_id
              ? { ...g, ...payload, updated_at: new Date().toISOString() }
              : g
          )
        )
        toast.success('Customer group updated')
      }
      closeGroupModal()
    } catch (err) {
      console.error('Failed to save customer group', err)
      toast.error('Failed to save customer group')
    }
  }

  function cancelMoveStep() {
    setShowMoveStep(false)
    setMoveTargetGroupId('')
  }

  async function loadMembers(group: CustomerGroup) {
    setMembersLoading(true)
    try {
      const res = await getEveningCustomers({
        page: 1,
        perPage: 200,
        customerGroupId: group.customer_group_id,
      })
      setMembers(res.data ?? [])
      setSelectedMemberIds([])
    } catch (err) {
      console.error('Failed to load group members', err)
      toast.error('Failed to load group members')
      setMembers([])
    } finally {
      setMembersLoading(false)
    }
  }

  async function openMembersModal(group: CustomerGroup) {
    setMembersGroup(group)
    setShowMembersModal(true)
    setSelectedMemberIds([])
    setSelectedAddIds([])
    setAddSearch('')
    setAddResults([])
    setAddSearchAttempted(false)
    cancelMoveStep()
    await loadMembers(group)
  }

  function closeMembersModal() {
    setShowMembersModal(false)
    setMembersGroup(null)
    cancelMoveStep()
  }

  function toggleId(list: number[], id: number) {
    return list.includes(id) ? list.filter(value => value !== id) : [...list, id]
  }

  async function searchCustomersToAdd() {
    const q = addSearch.trim()
    if (!q) {
      toast.info('Enter a customer name to search')
      return
    }

    setAddSearching(true)
    setAddSearchAttempted(true)
    setSelectedAddIds([])

    try {
      const res = await getEveningCustomers({ page: 1, perPage: 50, q })
      const memberIds = new Set(members.map(m => m.customer_id))
      setAddResults((res.data ?? []).filter(c => !memberIds.has(c.customer_id)))
    } catch (err) {
      console.error('Failed to search customers', err)
      toast.error('Failed to search customers')
      setAddResults([])
    } finally {
      setAddSearching(false)
    }
  }

  async function addSelectedCustomers() {
    if (!membersGroup || selectedAddIds.length === 0) return

    setAssigning(true)
    try {
      await bulkAssignEveningCustomers({
        customerGroupId: membersGroup.customer_group_id,
        ids: selectedAddIds,
      })
      toast.success('Customers added to group')
      setSelectedAddIds([])
      setAddResults([])
      setAddSearch('')
      setAddSearchAttempted(false)
      await loadMembers(membersGroup)
    } catch (err) {
      console.error('Failed to add customers', err)
      toast.error('Failed to add customers to group')
    } finally {
      setAssigning(false)
    }
  }

  async function moveSelectedMembers() {
    if (!membersGroup || !moveTargetGroupId || selectedMemberIds.length === 0) return

    setAssigning(true)
    try {
      await bulkAssignEveningCustomers({
        customerGroupId: Number(moveTargetGroupId),
        ids: selectedMemberIds,
      })
      toast.success('Customers moved to selected group')
      cancelMoveStep()
      await loadMembers(membersGroup)
    } catch (err) {
      console.error('Failed to move customers', err)
      toast.error('Failed to move customers')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="container">
      <PageHeader
        title="Customer Groups"
        subtitle="Manage group names, positions, visibility, and members."
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => openGroupModal('add')}
        >
          Add Group
        </button>
      </PageHeader>

      <div className="mb-3 row gx-2">
        <div className="">
          <input
            className="form-control"
            placeholder="Search group by id or name"
            value={groupSearch}
            onChange={e => setGroupSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading customer groups..." />
      ) : filteredGroups.length === 0 ? (
        <EmptyState title="No groups found" />
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Position</th>
                <th>Visible</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map(item => (
                <tr key={item.customer_group_id}>
                  <td>{item.customer_group_id}</td>
                  <td>{item.group_name}</td>
                  <td>{item.position}</td>
                  <td>
                    <span
                      className={item.visible ? 'badge bg-success' : 'badge bg-secondary'}
                    >
                      {item.visible ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => void openMembersModal(item)}
                      >
                        Members
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openGroupModal('edit', item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => openDeleteModal(item.customer_group_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CommonModal
        show={showGroupModal}
        title={groupMode === 'add' ? 'Add Group' : 'Edit Group'}
        onClose={closeGroupModal}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeGroupModal}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveGroup}
              disabled={!groupForm.group_name.trim()}
            >
              Save
            </button>
          </>
        }
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            void saveGroup()
          }}
        >
          <div className="mb-3">
            <label className="form-label">Group Name</label>
            <input
              className="form-control"
              value={groupForm.group_name}
              onChange={e => {
                const value = e.target.value
                setGroupForm(prev => ({ ...prev, group_name: value }))
                validateGroupName(value)
              }}
            />
            {groupErrors.group_name ? (
              <div className="text-danger small mt-1">{groupErrors.group_name}</div>
            ) : null}
          </div>
          <div className="mb-3">
            <label className="form-label">Position</label>
            <input
              type="number"
              className="form-control"
              value={groupForm.position}
              onChange={e =>
                setGroupForm(prev => ({ ...prev, position: Number(e.target.value) }))
              }
            />
          </div>
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="groupVisible"
              checked={groupForm.visible}
              onChange={e => setGroupForm(prev => ({ ...prev, visible: e.target.checked }))}
            />
            <label className="form-check-label" htmlFor="groupVisible">
              Visible
            </label>
          </div>
        </form>
      </CommonModal>

      <CommonModal
        show={showDeleteModal}
        title="Delete Customer Group"
        onClose={closeDeleteModal}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmDeleteGroup}>
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this customer group?</p>
      </CommonModal>

      <CommonModal
        show={showMembersModal}
        size="lg"
        title={`Members — ${membersGroup?.group_name ?? 'Group'}`}
        onClose={closeMembersModal}
        footer={
          <button type="button" className="btn btn-secondary" onClick={closeMembersModal}>
            Close
          </button>
        }
      >
        {membersLoading ? (
          <LoadingState message="Loading members..." />
        ) : (
          <>
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Current members ({members.length})</strong>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning"
                  disabled={selectedMemberIds.length === 0 || moveTargets.length === 0}
                  onClick={() => setShowMoveStep(true)}
                >
                  Move selected…
                </button>
              </div>

              {members.length === 0 ? (
                <EmptyState title="No customers in this group." />
              ) : (
                <div className="member-list">
                  {members.map(member => (
                    <label key={member.customer_id} className="member-row">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(member.customer_id)}
                        onChange={() =>
                          setSelectedMemberIds(prev => toggleId(prev, member.customer_id))
                        }
                      />
                      <span>{member.customer_name}</span>
                      <span className="text-muted small">#{member.customer_id}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {showMoveStep ? (
              <div className="border rounded p-3 mb-3 bg-light">
                <label className="form-label">Move selected to another group</label>
                <select
                  className="form-select mb-2"
                  value={moveTargetGroupId === '' ? '' : String(moveTargetGroupId)}
                  onChange={e =>
                    setMoveTargetGroupId(e.target.value ? Number(e.target.value) : '')
                  }
                >
                  <option value="">Select group</option>
                  {moveTargets.map(group => (
                    <option key={group.customer_group_id} value={group.customer_group_id}>
                      {group.group_name}
                    </option>
                  ))}
                </select>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={cancelMoveStep}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-warning"
                    disabled={!moveTargetGroupId || assigning}
                    onClick={() => void moveSelectedMembers()}
                  >
                    {assigning ? 'Moving…' : 'Confirm move'}
                  </button>
                </div>
              </div>
            ) : null}

            <hr />

            <div>
              <strong className="d-block mb-2">Add customers</strong>
              <div className="input-group mb-2">
                <input
                  className="form-control"
                  placeholder="Search customers by name"
                  value={addSearch}
                  onChange={e => setAddSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void searchCustomersToAdd()
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={addSearching}
                  onClick={() => void searchCustomersToAdd()}
                >
                  {addSearching ? 'Searching…' : 'Search'}
                </button>
              </div>

              {addResults.length === 0 && addSearchAttempted ? (
                <EmptyState title="No matching customers outside this group." />
              ) : null}

              {addResults.length > 0 ? (
                <div className="member-list mb-2">
                  {addResults.map(customer => (
                    <label key={customer.customer_id} className="member-row">
                      <input
                        type="checkbox"
                        checked={selectedAddIds.includes(customer.customer_id)}
                        onChange={() =>
                          setSelectedAddIds(prev => toggleId(prev, customer.customer_id))
                        }
                      />
                      <span>{customer.customer_name}</span>
                      <span className="text-muted small">
                        #{customer.customer_id}
                        {customer.group ? ` · ${customer.group}` : ''}
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={selectedAddIds.length === 0 || assigning}
                onClick={() => void addSelectedCustomers()}
              >
                {assigning
                  ? 'Adding…'
                  : `Add selected (${selectedAddIds.length})`}
              </button>
            </div>
          </>
        )}
      </CommonModal>

      <style jsx>{`
        .member-list {
          max-height: 220px;
          overflow-y: auto;
          border: 1px solid #dee2e6;
          border-radius: 0.375rem;
        }

        .member-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.75rem;
          margin: 0;
          border-bottom: 1px solid #f1f1f1;
          cursor: pointer;
        }

        .member-row:last-child {
          border-bottom: none;
        }

        .member-row:hover {
          background: #f8f9fa;
        }
      `}</style>
    </div>
  )
}
