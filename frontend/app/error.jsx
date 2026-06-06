'use client'
import { useEffect } from 'react'

// [NEW UI-002] Error Boundary cho Next.js App Router
// Tự động catch lỗi runtime trong component tree, hiển thị UI thay vì màn hình trắng
export default function Error({ error, reset }) {
  useEffect(() => {
    // Log lỗi để debug
    console.error('App Error:', error)
  }, [error])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'rgba(239,68,68,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem'
      }}>
        ⚠️
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
        Đã xảy ra lỗi!
      </h2>
      <p style={{
        color: '#6b7280',
        textAlign: 'center',
        maxWidth: '400px',
        margin: 0,
        fontSize: '0.875rem'
      }}>
        {error?.message || 'Lỗi không xác định. Vui lòng thử lại.'}
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: '0.5rem 1.5rem',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 600
        }}
      >
        Thử lại
      </button>
    </div>
  )
}
