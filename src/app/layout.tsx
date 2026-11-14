import type { Metadata } from 'next'
import BootstrapClient from '@/components/layout/BootstrapClient'
import NavBar from '@/components/layout/NavBar'
import ToastProvider from '@/components/layout/ToastProvider'
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'DEB ENTERPRISE',
    template: 'MStore | %s',
  },
  description: 'MStore evening sales and order management',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        <BootstrapClient />
        <ToastProvider />
        <NavBar />
        <div className="container-fluid py-2">{children}</div>
      </body>
    </html>
  )
}
