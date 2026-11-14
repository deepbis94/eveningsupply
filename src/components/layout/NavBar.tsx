'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark p-0 w-100">
      <div className="container-fluid">
        <Link className="navbar-brand" href="/">
          DEB ENTERPRISE
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Evening
              </a>
              <ul className="dropdown-menu dropdown-menu-dark">
                <li>
                  <Link
                    className={`dropdown-item${isActive('/sales/evening') ? ' active' : ''}`}
                    href="/sales/evening"
                  >
                    Sales
                  </Link>
                </li>
                <li>
                  <Link
                    className={`dropdown-item${isActive('/sales/total') ? ' active' : ''}`}
                    href="/sales/total"
                  >
                    Total
                  </Link>
                </li>
              </ul>
            </li>

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Order
              </a>
              <ul className="dropdown-menu dropdown-menu-dark">
                <li>
                  <Link
                    className={`dropdown-item${isActive('/order/list') ? ' active' : ''}`}
                    href="/order/list"
                  >
                    List Current
                  </Link>
                </li>
                <li>
                  <Link
                    className={`dropdown-item${isActive('/order/payment') ? ' active' : ''}`}
                    href="/order/payment"
                  >
                    Order Payment
                  </Link>
                </li>
                <li>
                  <Link
                    className={`dropdown-item${isActive('/order/delete') ? ' active' : ''}`}
                    href="/order/delete"
                  >
                    Delete Order
                  </Link>
                </li>
                <li>
                  <Link
                    className={`dropdown-item${isActive('/order/history') ? ' active' : ''}`}
                    href="/order/history"
                  >
                    History
                  </Link>
                </li>
              </ul>
            </li>

            <li className="nav-item">
              <Link
                className={`nav-link${isActive('/pay/total') ? ' active' : ''}`}
                href="/pay/total"
              >
                Payment Total
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link${isActive('/customers/evening') ? ' active' : ''}`}
                href="/customers/evening"
              >
                Customers
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link${isActive('/customers/groups') ? ' active' : ''}`}
                href="/customers/groups"
              >
                Groups
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link${isActive('/product/list') ? ' active' : ''}`}
                href="/product/list"
              >
                Products
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link${isActive('/info/company') ? ' active' : ''}`}
                href="/info/company"
              >
                Company
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
