'use client'

// [NEW UI-002] Global Error Boundary - catch lỗi ở root layout
// Dùng khi lỗi xảy ra trong root layout (app/layout.jsx)
export default function GlobalError({ error, reset }) {
  return (
    <html lang="vi">
      <body style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        margin: 0,
        fontFamily: 'system-ui, sans-serif',
        background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔴</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Lỗi hệ thống nghiêm trọng
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {error?.message || 'Đã xảy ra lỗi không mong muốn'}
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
              fontSize: '0.875rem'
            }}
          >
            Tải lại trang
          </button>
        </div>
      </body>
    </html>
  )
}
