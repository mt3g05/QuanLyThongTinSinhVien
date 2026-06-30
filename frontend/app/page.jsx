"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { User, Lock, Eye, EyeOff, ArrowRight, Shield, LockKeyhole } from "lucide-react"
import authService from "@/lib/services/authService"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Force Change Password State
  const [showForceChange, setShowForceChange] = useState(false)
  const [tempToken, setTempToken] = useState("")
  const [forceUsername, setForceUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const { login, user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/student")
      }
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await login(username, password, rememberMe)
      if (result.requirePasswordChange) {
        setShowForceChange(true)
        setTempToken(result.tempToken)
        setForceUsername(result.user.username)
        return
      }
      if (!result.success) {
        setError(result.message)
      }
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForceChangePassword = async (e) => {
    e.preventDefault()
    setError("")
    
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.")
      return
    }
    
    const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      setError("Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái, số và ký tự đặc biệt.")
      return
    }
    
    setIsLoading(true)
    try {
      const response = await authService.forceChangePassword(tempToken, newPassword)
      const { user, accessToken, refreshToken } = response.data
      
      if (typeof window !== "undefined") {
        localStorage.setItem("ptit_token", accessToken)
        if (refreshToken) {
          localStorage.setItem("ptit_refresh_token", refreshToken)
        }
        localStorage.setItem("ptit_user", JSON.stringify(user))
      }
      
      // Reload page to re-initialize authContext
      if (user.role === "admin") {
        window.location.href = "/admin"
      } else {
        window.location.href = "/student"
      }
    } catch (err) {
      setError(err.message || "Lỗi khi đổi mật khẩu.")
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-form-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="spinner" style={{ width: '3rem', height: '3rem', borderWidth: '3px' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      {/* Left Banner */}
      <div className="login-branding">
        <div className="login-branding-content">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-text">PTIT</div>
            <div className="login-logo-subtitle">
              <span>Học viện Công nghệ Bưu chính Viễn thông</span>
              <span>Posts & Telecommunications Institute of Technology</span>
            </div>
          </div>

          {/* Main Content */}
          <div>
            <div className="login-badge">
              <span className="login-badge-dot"></span>
              HỆ THỐNG QUẢN LÝ THÔNG TIN SINH VIÊN
            </div>
            
            <h1 className="login-title">
              Cổng thông tin<br />sinh viên
            </h1>
            
            <p className="login-description">
              Nền tảng quản lý học vụ tập trung dành cho sinh viên, giảng viên và cán bộ quản lý của Học viện Công nghệ Bưu chính Viễn thông.
            </p>

            {/* Stats */}
            <div className="login-stats">
              <div className="login-stat">
                <span className="login-stat-value">15,000+</span>
                <span className="login-stat-label">Sinh viên</span>
              </div>
              <div className="login-stat">
                <span className="login-stat-value">800+</span>
                <span className="login-stat-label">Giảng viên</span>
              </div>
              <div className="login-stat">
                <span className="login-stat-value">420+</span>
                <span className="login-stat-label">Môn học</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-branding-footer">
          © 2025 Học viện Công nghệ Bưu chính Viễn thông — ptit.edu.vn
        </div>
      </div>

      {/* Right Form */}
      <div className="login-form-panel">
        <div className="login-form-container">
          {showForceChange ? (
            <>
              <h2 className="login-form-title">Đổi mật khẩu bắt buộc</h2>
              <p style={{marginBottom: "1.5rem", color: "var(--muted-foreground)", fontSize: "14px"}}>
                Xin chào <strong>{forceUsername}</strong>, đây là lần đăng nhập đầu tiên. Bạn bắt buộc phải đổi mật khẩu để bảo vệ tài khoản.
              </p>

              <form onSubmit={handleForceChangePassword} className="login-form">
                {/* New Password Field */}
                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <div className="form-input-wrapper">
                    <Lock className="form-input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="Mật khẩu mới..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="form-input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="form-group">
                  <label className="form-label">Xác nhận mật khẩu</label>
                  <div className="form-input-wrapper">
                    <Lock className="form-input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="Nhập lại mật khẩu..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="form-error">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="login-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="login-loading">
                      <span className="spinner"></span>
                      Đang cập nhật...
                    </span>
                  ) : (
                    <>
                      Đổi mật khẩu & Đăng nhập
                      <ArrowRight />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="login-form-title">Đăng nhập</h2>

              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}

              <form className="login-form" onSubmit={handleSubmit}>
                {/* Username */}
                <div className="form-group">
                  <label className="form-label">Tên đăng nhập</label>
                  <div className="form-input-wrapper">
                    <User className="form-input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nhập tên đăng nhập..."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label">Mật khẩu</label>
                  <div className="form-input-wrapper">
                    <Lock className="form-input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="Nhập mật khẩu..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="form-input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                {/* Options Row */}
                <div className="form-options">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Ghi nhớ đăng nhập
                  </label>
                  <a href="#" className="form-link" onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); }}>Quên mật khẩu?</a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="login-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="login-loading">
                      <span className="spinner"></span>
                      Đang đăng nhập...
                    </span>
                  ) : (
                    <>
                      Đăng nhập hệ thống
                      <ArrowRight />
                    </>
                  )}
                </button>

                {/* Security Info */}
                <div className="login-security">
                  <span className="login-security-item">
                    <Shield />
                    Kết nối bảo mật SSL
                  </span>
                  <span className="login-security-divider">•</span>
                  <span className="login-security-item">
                    <LockKeyhole />
                    Dữ liệu mã hoá
                  </span>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--card)", padding: "2rem", borderRadius: "0.75rem", width: 450, maxWidth: "90%", border: "1px solid var(--border)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontWeight: 700, margin: "0 0 1rem 0", fontSize: "18px", color: "var(--foreground)" }}>Khôi phục mật khẩu</h3>
            <div style={{ padding: "1rem", background: "rgba(37,99,235,0.05)", borderLeft: "4px solid #2563eb", borderRadius: "4px", marginBottom: "1.5rem" }}>
              <p style={{ color: "var(--foreground)", marginBottom: "0.75rem", fontSize: "14px", lineHeight: "1.5" }}>
                Để đảm bảo tính bảo mật của hệ thống, vui lòng liên hệ trực tiếp với các đơn vị sau để được hỗ trợ cấp lại mật khẩu:
              </p>
              <ul style={{ color: "var(--muted-foreground)", fontSize: "14px", lineHeight: "1.6", margin: 0, paddingLeft: "1.25rem" }}>
                <li><strong>Phòng Đào tạo:</strong> (024) 3854 5272</li>
                <li><strong>Phòng Công tác SV:</strong> (024) 3854 7795</li>
                <li><strong>IT Support:</strong> cskh@ptit.edu.vn</li>
              </ul>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setShowForgotPassword(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
