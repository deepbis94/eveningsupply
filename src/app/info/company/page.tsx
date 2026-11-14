'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { getFirstCompanyInfo, updateCompanyInfo } from '@/lib/api/company'
import type { Company } from '@/types/Company'
import { toast } from '@/lib/utils/toast'

type EditableSection =
  | 'name'
  | 'address'
  | 'mobile'
  | 'cleanupEmail'
  | 'cleanupDays'
  | 'mailMailer'
  | 'mailScheme'
  | 'mailHost'
  | 'mailPort'
  | 'mailUsername'
  | 'mailPassword'
  | 'mailFromAddress'
  | 'mailFromName'

type EditableField =
  | 'company_name'
  | 'company_address'
  | 'company_mobile'
  | 'cleanup_email'
  | 'cleanup_days'
  | 'mail_mailer'
  | 'mail_scheme'
  | 'mail_host'
  | 'mail_port'
  | 'mail_username'
  | 'mail_password'
  | 'mail_from_address'
  | 'mail_from_name'

type SmtpTextField = Exclude<EditableField, 'cleanup_days' | 'mail_port'>

type EditingState = Record<EditableSection, boolean>
type EditState = {
  company_name: string
  company_address: string
  company_mobile: string
  cleanup_email: string
  cleanup_days: number
  mail_mailer: string
  mail_scheme: string
  mail_host: string
  mail_port: number
  mail_username: string
  mail_password: string
  mail_from_address: string
  mail_from_name: string
}
type ErrorState = Record<EditableField, string>

const emptyEditing: EditingState = {
  name: false,
  address: false,
  mobile: false,
  cleanupEmail: false,
  cleanupDays: false,
  mailMailer: false,
  mailScheme: false,
  mailHost: false,
  mailPort: false,
  mailUsername: false,
  mailPassword: false,
  mailFromAddress: false,
  mailFromName: false,
}

const emptyEdit: EditState = {
  company_name: '',
  company_address: '',
  company_mobile: '',
  cleanup_email: '',
  cleanup_days: 1,
  mail_mailer: '',
  mail_scheme: '',
  mail_host: '',
  mail_port: 587,
  mail_username: '',
  mail_password: '',
  mail_from_address: '',
  mail_from_name: '',
}

const emptyErrors: ErrorState = {
  company_name: '',
  company_address: '',
  company_mobile: '',
  cleanup_email: '',
  cleanup_days: '',
  mail_mailer: '',
  mail_scheme: '',
  mail_host: '',
  mail_port: '',
  mail_username: '',
  mail_password: '',
  mail_from_address: '',
  mail_from_name: '',
}

const smtpSections: Array<{
  section: EditableSection
  field: EditableField
  label: string
  inputType: string
}> = [
  { section: 'mailMailer', field: 'mail_mailer', label: 'Mailer', inputType: 'text' },
  { section: 'mailScheme', field: 'mail_scheme', label: 'Scheme', inputType: 'text' },
  { section: 'mailHost', field: 'mail_host', label: 'Host', inputType: 'text' },
  { section: 'mailPort', field: 'mail_port', label: 'Port', inputType: 'number' },
  { section: 'mailUsername', field: 'mail_username', label: 'Username', inputType: 'text' },
  { section: 'mailPassword', field: 'mail_password', label: 'Password', inputType: 'password' },
  {
    section: 'mailFromAddress',
    field: 'mail_from_address',
    label: 'From Address',
    inputType: 'email',
  },
  { section: 'mailFromName', field: 'mail_from_name', label: 'From Name', inputType: 'text' },
]

function isTextField(field: EditableField): field is SmtpTextField {
  return field !== 'cleanup_days' && field !== 'mail_port'
}

function getFieldKey(field: EditableSection): EditableField {
  if (field === 'name') return 'company_name'
  if (field === 'address') return 'company_address'
  if (field === 'mobile') return 'company_mobile'
  if (field === 'cleanupEmail') return 'cleanup_email'
  if (field === 'cleanupDays') return 'cleanup_days'
  if (field === 'mailMailer') return 'mail_mailer'
  if (field === 'mailScheme') return 'mail_scheme'
  if (field === 'mailHost') return 'mail_host'
  if (field === 'mailPort') return 'mail_port'
  if (field === 'mailUsername') return 'mail_username'
  if (field === 'mailPassword') return 'mail_password'
  if (field === 'mailFromAddress') return 'mail_from_address'
  return 'mail_from_name'
}

function getFieldLabel(field: EditableField) {
  return smtpSections.find(item => item.field === field)?.label ?? 'Field'
}

function getFieldError(field: EditableField, edit: EditState): string {
  if (field === 'company_name') {
    return edit.company_name?.trim() ? '' : 'Name is required'
  }
  if (field === 'company_address') {
    return edit.company_address?.trim() ? '' : 'Address is required'
  }
  if (field === 'company_mobile') {
    return /^[0-9+\-\s()]{7,20}$/.test(edit.company_mobile)
      ? ''
      : 'Enter a valid mobile number (7-20 digits, may include +, space, -)'
  }
  if (field === 'cleanup_email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(edit.cleanup_email)
      ? ''
      : 'Enter a valid cleanup email address'
  }
  if (field === 'cleanup_days') {
    return Number.isInteger(Number(edit.cleanup_days)) && Number(edit.cleanup_days) > 0
      ? ''
      : 'Cleanup days must be a positive whole number'
  }
  if (field === 'mail_port') {
    return Number.isInteger(Number(edit.mail_port)) && Number(edit.mail_port) > 0
      ? ''
      : 'Mail port must be a positive whole number'
  }
  if (field === 'mail_from_address') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(edit.mail_from_address)
      ? ''
      : 'Enter a valid from email address'
  }
  if (field === 'mail_password') return ''
  if (isTextField(field)) {
    return edit[field]?.trim() ? '' : `${getFieldLabel(field)} is required`
  }
  return ''
}

function isValidField(field: EditableField, edit: EditState) {
  return getFieldError(field, edit) === ''
}

export default function CompanyInfoPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [editing, setEditing] = useState<EditingState>({ ...emptyEditing })
  const [edit, setEdit] = useState<EditState>({ ...emptyEdit })
  const [errors, setErrors] = useState<ErrorState>({ ...emptyErrors })
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('')

  function notify(message: string, type: 'success' | 'error' = 'success') {
    setStatusMessage(message)
    setStatusType(type)
  }

  function updateEditField<K extends keyof EditState>(key: K, value: EditState[K]) {
    setEdit(prev => {
      const next = { ...prev, [key]: value }
      if (
        key === 'company_name' ||
        key === 'company_address' ||
        key === 'company_mobile' ||
        key === 'cleanup_email' ||
        key === 'cleanup_days' ||
        key === 'mail_mailer' ||
        key === 'mail_scheme' ||
        key === 'mail_host' ||
        key === 'mail_port' ||
        key === 'mail_username' ||
        key === 'mail_password' ||
        key === 'mail_from_address' ||
        key === 'mail_from_name'
      ) {
        setErrors(errs => ({ ...errs, [key]: getFieldError(key, next) }))
      }
      return next
    })
  }

  async function fetchCompany() {
    try {
      const d = await getFirstCompanyInfo()
      if (!d) return

      setCompany({
        company_id: d.company_id,
        company_name: d.company_name,
        company_address: d.company_address,
        company_mobile: d.company_mobile,
        cleanup_email: d.cleanup_email ?? '',
        cleanup_days: Number(d.cleanup_days ?? 1),
        mail_mailer: d.mail_mailer ?? '',
        mail_scheme: d.mail_scheme ?? '',
        mail_host: d.mail_host ?? '',
        mail_port: Number(d.mail_port ?? 587),
        mail_username: d.mail_username ?? '',
        mail_password: d.mail_password ?? '',
        mail_from_address: d.mail_from_address ?? '',
        mail_from_name: d.mail_from_name ?? '',
      })
    } catch (err) {
      console.error('Failed to fetch company info', err)
      toast.error('Failed to fetch company info')
    }
  }

  useEffect(() => {
    void fetchCompany()
  }, [])

  function startEdit(field: EditableSection) {
    if (!company) return

    const fieldKey = getFieldKey(field)
    const nextEdit = { ...edit }

    if (field === 'name') nextEdit.company_name = company.company_name
    else if (field === 'address') nextEdit.company_address = company.company_address
    else if (field === 'mobile') nextEdit.company_mobile = company.company_mobile
    else if (field === 'cleanupEmail') nextEdit.cleanup_email = company.cleanup_email
    else if (field === 'cleanupDays') nextEdit.cleanup_days = company.cleanup_days
    else if (field === 'mailPort') nextEdit.mail_port = company.mail_port
    else if (isTextField(fieldKey)) nextEdit[fieldKey] = company[fieldKey]

    setEdit(nextEdit)
    setErrors(prev => ({ ...prev, [fieldKey]: getFieldError(fieldKey, nextEdit) }))
    setEditing(prev => ({ ...prev, [field]: true }))
  }

  function cancelEdit(field: EditableSection) {
    setEditing(prev => ({ ...prev, [field]: false }))
    setErrors(prev => ({ ...prev, [getFieldKey(field)]: '' }))
  }

  async function saveField(field: EditableSection) {
    const fieldKey = getFieldKey(field)
    const fieldError = getFieldError(fieldKey, edit)
    setErrors(prev => ({ ...prev, [fieldKey]: fieldError }))

    if (!isValidField(fieldKey, edit)) {
      toast.error('Please fix validation errors')
      return
    }

    if (!company) return

    const payload = {
      company_name:
        fieldKey === 'company_name' ? edit.company_name : company.company_name,
      company_address:
        fieldKey === 'company_address' ? edit.company_address : company.company_address,
      company_mobile:
        fieldKey === 'company_mobile' ? edit.company_mobile : company.company_mobile,
      cleanup_email:
        fieldKey === 'cleanup_email' ? edit.cleanup_email : company.cleanup_email,
      cleanup_days:
        fieldKey === 'cleanup_days' ? Number(edit.cleanup_days) : company.cleanup_days,
      mail_mailer: fieldKey === 'mail_mailer' ? edit.mail_mailer : company.mail_mailer,
      mail_scheme: fieldKey === 'mail_scheme' ? edit.mail_scheme : company.mail_scheme,
      mail_host: fieldKey === 'mail_host' ? edit.mail_host : company.mail_host,
      mail_port: fieldKey === 'mail_port' ? Number(edit.mail_port) : company.mail_port,
      mail_username:
        fieldKey === 'mail_username' ? edit.mail_username : company.mail_username,
      mail_password:
        fieldKey === 'mail_password' ? edit.mail_password : company.mail_password,
      mail_from_address:
        fieldKey === 'mail_from_address'
          ? edit.mail_from_address
          : company.mail_from_address,
      mail_from_name:
        fieldKey === 'mail_from_name' ? edit.mail_from_name : company.mail_from_name,
    }

    try {
      await updateCompanyInfo(company.company_id, payload)
      setCompany({ ...company, ...payload })
      setEditing(prev => ({ ...prev, [field]: false }))
      toast.success('Company info updated')
    } catch (err) {
      console.error('Failed to update company info', err)
      notify('Failed to update company info', 'error')
    }
  }

  function formatCompanyField(field: EditableField) {
    if (!company) return 'Not set'
    if (field === 'mail_password') {
      return company.mail_password ? '********' : 'Not set'
    }

    const value = company[field]
    return value === '' || value === null || value === undefined
      ? 'Not set'
      : String(value)
  }

  function renderEditableCard(
    section: EditableSection,
    label: string,
    display: ReactNode,
    editor: ReactNode
  ) {
    return (
      <div key={section} className="col-md-4 mb-3">
        <div className="card h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-subtitle mt-1 text-muted">{label}</h6>
              </div>
              {!editing[section] ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => startEdit(section)}
                >
                  Edit
                </button>
              ) : null}
            </div>

            {!editing[section] ? (
              <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>
                {display}
              </p>
            ) : (
              <div>
                {editor}
                <div className="mt-3 d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => cancelEdit(section)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void saveField(section)}
                    disabled={!isValidField(getFieldKey(section), edit)}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="container mt-4">
        {statusMessage ? (
          <div
            className={`alert ${statusType === 'error' ? 'alert-danger' : 'alert-success'}`}
          >
            {statusMessage}
          </div>
        ) : (
          <p className="text-muted">Loading company information...</p>
        )}
      </div>
    )
  }

  return (
    <div className="container mt-4">
      <div className="row mt-4">
        {renderEditableCard(
          'name',
          'Name',
          company.company_name,
          <>
            <input
              className="form-control"
              value={edit.company_name}
              onChange={e => updateEditField('company_name', e.target.value)}
            />
            {errors.company_name ? (
              <div className="text-danger small mt-1">{errors.company_name}</div>
            ) : null}
          </>
        )}

        {renderEditableCard(
          'address',
          'Address',
          company.company_address,
          <>
            <textarea
              className="form-control"
              value={edit.company_address}
              onChange={e => updateEditField('company_address', e.target.value)}
            />
            {errors.company_address ? (
              <div className="text-danger small mt-1">{errors.company_address}</div>
            ) : null}
          </>
        )}

        {renderEditableCard(
          'mobile',
          'Mobile',
          company.company_mobile,
          <>
            <input
              className="form-control"
              value={edit.company_mobile}
              onChange={e => updateEditField('company_mobile', e.target.value)}
            />
            {errors.company_mobile ? (
              <div className="text-danger small mt-1">{errors.company_mobile}</div>
            ) : null}
          </>
        )}

        {renderEditableCard(
          'cleanupEmail',
          'Cleanup Email',
          company.cleanup_email || 'Not set',
          <>
            <input
              className="form-control"
              type="email"
              value={edit.cleanup_email}
              onChange={e => updateEditField('cleanup_email', e.target.value)}
            />
            {errors.cleanup_email ? (
              <div className="text-danger small mt-1">{errors.cleanup_email}</div>
            ) : null}
          </>
        )}

        {renderEditableCard(
          'cleanupDays',
          'Cleanup Days',
          `${company.cleanup_days} days`,
          <>
            <input
              className="form-control"
              type="number"
              min={1}
              step={1}
              value={edit.cleanup_days}
              onChange={e => updateEditField('cleanup_days', Number(e.target.value))}
            />
            {errors.cleanup_days ? (
              <div className="text-danger small mt-1">{errors.cleanup_days}</div>
            ) : null}
          </>
        )}
      </div>

      <section className="mt-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4 className="mb-1">SMTP</h4>
            <p className="text-muted mb-0">
              Mail delivery configuration for automated emails.
            </p>
          </div>
        </div>

        <div className="row">
          {smtpSections.map(item =>
            renderEditableCard(
              item.section,
              item.label,
              formatCompanyField(item.field),
              <>
                {item.field === 'mail_port' ? (
                  <input
                    className="form-control"
                    type="number"
                    min={1}
                    step={1}
                    value={edit.mail_port}
                    onChange={e => updateEditField('mail_port', Number(e.target.value))}
                  />
                ) : (
                  <input
                    className="form-control"
                    type={
                      item.field === 'mail_password' ? 'password' : item.inputType
                    }
                    value={String(edit[item.field] ?? '')}
                    onChange={e => {
                      const field = item.field
                      if (field === 'cleanup_days' || field === 'mail_port') return
                      updateEditField(field, e.target.value)
                    }}
                  />
                )}
                {errors[item.field] ? (
                  <div className="text-danger small mt-1">{errors[item.field]}</div>
                ) : null}
              </>
            )
          )}
        </div>
      </section>
    </div>
  )
}
