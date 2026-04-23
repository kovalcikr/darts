import type { Metadata } from 'next'
import './globals.css'

let VercelTelemetry: null | (() => React.JSX.Element) = null

if (process.env.NODE_ENV === 'production') {
  VercelTelemetry = require('./components/VercelTelemetry').default
}

export const metadata: Metadata = {
  title: 'Relax Darts Cup',
  description: 'Štatistiky ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        {VercelTelemetry ? <VercelTelemetry /> : null}
      </body>
    </html>
  )
}
