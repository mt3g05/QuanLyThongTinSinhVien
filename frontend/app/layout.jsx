import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import '../styles/dashboard.css'
import '../styles/home.css'
import '../styles/login.css'
import { AuthProvider } from '@/contexts/auth-context'

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata = {
  title: 'PTIT - Hệ thống quản lý thông tin sinh viên',
  description: 'Cổng thông tin sinh viên - Học viện Công nghệ Bưu chính Viễn thông',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/ptit-favicon.ico',
        type: 'image/x-icon',
      },
    ],
    apple: '/ptit-favicon.ico',
    shortcut: '/ptit-favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className="bg-background">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
