import './globals.css'

export const metadata = {
  title: 'NookAI — Visualize Your Dream Space',
  description: 'AI-powered interior design visualization',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
