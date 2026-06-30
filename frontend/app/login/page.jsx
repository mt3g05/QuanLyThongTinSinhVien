"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Lock, Eye, EyeOff, ArrowRight, Shield, ShieldCheck } from "lucide-react"
import "@/styles/login.css"
import authService from "@/lib/services/authService"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Force Change Password State
  const [showForceChange, setShowForceChange] = useState(false)
  const [tempToken, setTempToken] = useState("")
  const [forceUsername, setForceUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await authService.login(username, password)
      
      if (response.data.requirePasswordChange) {
        setShowForceChange(true)
        setTempToken(response.data.tempToken)
        setForceUsername(response.data.user.username)
        return
      }
      
      const { user, accessToken, refreshToken } = response.data
      
      if (typeof window !== "undefined") {
        localStorage.setItem("ptit_token", accessToken)
        if (refreshToken) {
          localStorage.setItem("ptit_refresh_token", refreshToken)
        }
        localStorage.setItem("ptit_user", JSON.stringify(user))
      }
      
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/student")
      }
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.")
    } finally {
      setLoading(false)
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
    
    setLoading(true)
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
      
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/student")
      }
    } catch (err) {
      setError(err.message || "Lỗi khi đổi mật khẩu.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Left Panel - Branding */}
      <div className="login-branding">
        <div className="login-branding-content">
          {/* Logo */}
          <div className="login-logo">
            <span className="login-logo-text">PTIT</span>
            <div className="login-logo-subtitle">
              <span>Học viện Công nghệ Bưu chính Viễn thông</span>
              <span>Posts & Telecommunications Institute of Technology</span>
            </div>
          </div>

          {/* Badge */}
          <div className="login-badge">
            <span className="login-badge-dot"></span>
            Hệ thống quản lý thông tin sinh viên
          </div>

          {/* Main Title */}
          <h1 className="login-title">Cổng thông tin sinh viên</h1>
          
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

        {/* Footer */}
        <div className="login-branding-footer">
          <p>© 2025 Học viện Công nghệ Bưu chính Viễn thông — ptit.edu.vn</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
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
                  disabled={loading}
                >
                  {loading ? (
                    <span className="login-loading">Đang cập nhật...</span>
                  ) : (
                    <>
                      <span>Đổi mật khẩu & Đăng nhập</span>
                      <ArrowRight />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="login-form-title">Đăng nhập</h2>

              <form onSubmit={handleSubmit} className="login-form">
                {/* Username Field */}
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

                {/* Password Field */}
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

                {/* Error Message */}
                {error && (
                  <div className="form-error">
                    {error}
                  </div>
                )}

                {/* Remember Me & Forgot Password */}
                <div className="form-options">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <a href="#" className="form-link" onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); }}>Quên mật khẩu?</a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="login-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="login-loading">Đang đăng nhập...</span>
                  ) : (
                    <>
                      <span>Đăng nhập hệ thống</span>
                      <ArrowRight />
                    </>
                  )}
                </button>

                {/* Security Info */}
                <div className="login-security">
                  <div className="login-security-item">
                    <Shield />
                    <span>Kết nối bảo mật SSL</span>
                  </div>
                  <span className="login-security-divider">•</span>
                  <div className="login-security-item">
                    <ShieldCheck />
                    <span>Dữ liệu mã hoá</span>
                  </div>
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
