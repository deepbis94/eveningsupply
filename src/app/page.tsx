import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const sections = [
  {
    title: 'Evening Sales',
    description: 'Enter evening orders and review product totals.',
    links: [
      {
        label: 'Evening Sales',
        href: '/sales/evening',
        description: 'Group-wise sales entry with sticky grand totals.',
      },
      {
        label: 'Evening Total',
        href: '/sales/total',
        description: 'Current-date product summaries by customer group.',
      },
    ],
  },
  {
    title: 'Orders',
    description: 'Review, print, delete, and search customer bills.',
    links: [
      {
        label: 'Current Orders',
        href: '/order/list',
        description: "Today's bills with products, dues, and print action.",
      },
      {
        label: 'Order Payment',
        href: '/order/payment',
        description: 'Payment for today\'s bills and print action.',
      },
      {
        label: 'Delete Order',
        href: '/order/delete',
        description: 'Search current-date bills and delete selected orders.',
      },
      {
        label: 'Order History',
        href: '/order/history',
        description: 'Search bills by date range and export CSV/PDF.',
      },
    ],
  },
  {
    title: 'Payments',
    description: 'Track payment totals from today\'s evening bills.',
    links: [
      {
        label: 'Payment Total',
        href: '/pay/total',
        description: 'Group-wise total bill and payment cards for today.',
      },
    ],
  },
  {
    title: 'Customers',
    description: 'Maintain customers and customer groups.',
    links: [
      {
        label: 'Evening Customers',
        href: '/customers/evening',
        description: 'Add, edit, delete, import, and export customers.',
      },
      {
        label: 'Customer Groups',
        href: '/customers/groups',
        description: 'Manage group names, positions, and visibility.',
      },
    ],
  },
  {
    title: 'Products',
    description: 'Maintain products, colors, rates, and visibility.',
    links: [
      {
        label: 'Product List',
        href: '/product/list',
        description: 'Add, edit, delete, search, and paginate products.',
      },
    ],
  },
  {
    title: 'Settings',
    description: 'Configure company details used by the business.',
    links: [
      {
        label: 'Company Information',
        href: '/info/company',
        description: 'Edit company name, address, and mobile number.',
      },
    ],
  },
]

const stats = [
  {
    label: 'Feature Areas',
    value: sections.length,
    short: 'FA',
    iconClass: 'bg-primary-subtle text-primary',
  },
  {
    label: 'Available Pages',
    value: sections.reduce((sum, section) => sum + section.links.length, 0),
    short: 'PG',
    iconClass: 'bg-success-subtle text-success',
  },
  {
    label: 'Order Tools',
    value: 4,
    short: 'OR',
    iconClass: 'bg-warning-subtle text-warning',
  },
  {
    label: 'Master Data',
    value: 3,
    short: 'MD',
    iconClass: 'bg-info-subtle text-info',
  },
]

export default function DashboardPage() {
  return (
    <div className="dashboard py-4">
      <div className="card mb-4">
        <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h1 className="display-6 fw-bold mb-2">Dashboard</h1>
            <p className="text-muted mb-0">
              Manage evening sales, customer bills, payments, products, customers, and
              company information from one place.
            </p>
          </div>
          <Link href="/sales/evening" className="btn btn-primary btn-lg">
            Start Evening Sales
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {stats.map(stat => (
          <div key={stat.label} className="col-12 col-md-6 col-xl-3">
            <div className="card h-100">
              <div className="card-body">
                <div
                  className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${stat.iconClass}`}
                  style={{ width: 40, height: 40, fontWeight: 700 }}
                >
                  {stat.short}
                </div>
                <h3 className="h2 fw-bold mb-1">{stat.value}</h3>
                <p className="text-muted mb-0">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {sections.map(section => (
          <div key={section.title} className="col-12 col-lg-6 col-xxl-4">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                  <div>
                    <h2 className="h5 fw-bold mb-1">{section.title}</h2>
                    <p className="text-muted mb-0">{section.description}</p>
                  </div>
                  <span className="badge rounded-pill text-bg-light">
                    {section.links.length} links
                  </span>
                </div>

                <div className="list-group list-group-flush">
                  {section.links.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    >
                      <span>
                        <span className="fw-semibold">{link.label}</span>
                        <small className="d-block text-muted">{link.description}</small>
                      </span>
                      <span>›</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
