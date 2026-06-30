
"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { useApi, useMutation } from "@/hooks/use-api"
import { settingService } from "@/lib/services/adminService"
import authService from "@/lib/services/authService"
import {
  Settings, User, Bell, Shield, Database,
  Globe, Save, Key, Users, CheckCircle,
  ToggleLeft, ToggleRight, Server, HardDrive,
  Clock, RefreshCw, Download, Upload, Eye,
  AlertTriangle, Zap, Lock, Palette, Languages
} from "lucide-react"

export default function SettingsPage() {
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Toggle states
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [systemAlerts, setSystemAlerts] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)

  // Form states
  const [generalForm, setGeneralForm] = useState({
    system_name: "",
    current_semester: "",
    language: "vi",
    timezone: "Asia/Ho_Chi_Minh",
    credit_price: "",
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  })
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  })

  // Fetch settings
  const { data: settings, loading: settingsLoading } = useApi(
    settingService.getAll, [], { defaultData: {} }
  )

  const { data: systemStatus, loading: statusLoading } = useApi(
    settingService.getSystemStatus, [], { defaultData: {} }
  )

  // Populate forms when settings loaded
  useEffect(function () {
    if (settings && Object.keys(settings).length > 0) {
      setGeneralForm({
        system_name: settings.system_name || "",
        current_semester: settings.current_semester || "",
        language: settings.language || "vi",
        timezone: settings.timezone || "Asia/Ho_Chi_Minh",
        credit_price: settings.credit_price || "",
      })
      setProfileForm({
        full_name: settings.admin_name || "",
        email: settings.admin_email || "",
        phone: settings.admin_phone || "",
      })
      setEmailNotifications(settings.email_notifications === "true")
      setSystemAlerts(settings.system_alerts === "true")
      setAutoBackup(settings.auto_backup === "true")
    }
  }, [settings])

  // Mutations
  const { mutate: saveGeneral, loading: savingGeneral } = useMutation(
    settingService.updateGeneral,
    {
      onSuccess: function () {
        showSuccess("Lưu cài đặt chung thành công")
      },
      onError: function (err) {
        showError(err.message)
      },
    }
  )

  const { mutate: changePassword, loading: changingPassword } = useMutation(
    authService.changePassword,
    {
      onSuccess: function () {
        showSuccess("Đổi mật khẩu thành công")
        setShowPasswordModal(false)
        setPasswordForm({ old_password: "", new_password: "", confirm_password: "" })
      },
      onError: function (err) {
        showError(err.message)
      },
    }
  )

  const { mutate: saveProfile, loading: savingProfile } = useMutation(
    settingService.updateProfile,
    {
      onSuccess: function () {
        showSuccess("Lưu thông tin tài khoản thành công")
      },
      onError: function (err) {
        showError(err.message)
      },
    }
  )

  const { mutate: saveNotifications, loading: savingNotif } = useMutation(
    settingService.updateNotifications,
    {
      onSuccess: function () {
        showSuccess("Lưu cài đặt thông báo thành công")
      },
      onError: function (err) {
        showError(err.message)
      },
    }
  )

  const { mutate: doBackup, loading: backingUp } = useMutation(
    settingService.backupDatabase,
    {
      onSuccess: function () {
        showSuccess("Sao lưu database thành công")
      },
      onError: function (err) {
        showError(err.message)
      },
    }
  )

  function showSuccess(msg) {
    setSuccessMsg(msg)
    setErrorMsg("")
    setTimeout(function () { setSuccessMsg("") }, 3000)
  }

  function showError(msg) {
    setErrorMsg(msg)
    setTimeout(function () { setErrorMsg("") }, 4000)
  }

  function handleSaveGeneral(e) {
    e.preventDefault()
    saveGeneral(generalForm)
  }

  function handleChangePassword(e) {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showError("Mật khẩu xác nhận không khớp")
      return
    }
    if (passwordForm.new_password.length < 6) {
      showError("Mật khẩu mới phải có ít nhất 6 ký tự")
      return
    }
    changePassword(passwordForm.old_password, passwordForm.new_password, passwordForm.confirm_password)
  }

  function handleSaveProfile(e) {
    e.preventDefault()
    saveProfile(profileForm)
  }

  function handleSaveNotifications() {
    saveNotifications({
      email_notifications: emailNotifications,
      system_alerts: systemAlerts,
      auto_backup: autoBackup,
    })
  }

  return (
    <div className="dashboard-content">
      <Header title="Cài đặt hệ thống" />

      <div className="dashboard-body">
        {successMsg && (
          <div style={{
            padding: "0.75rem 1rem", background: "#dcfce7",
            border: "1px solid #16a34a", borderRadius: "0.5rem",
            color: "#166534", fontSize: "0.875rem",
          }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{
            padding: "0.75rem 1rem", background: "#fee2e2",
            border: "1px solid #dc2626", borderRadius: "0.5rem",
            color: "#991b1b", fontSize: "0.875rem",
          }}>
            {errorMsg}
          </div>
        )}

        {/* System Status Cards */}
        <div className="summary-grid" style={{ marginBottom: "24px" }}>

          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon info"><HardDrive size={20} /></div>
            </div>
            <div className="summary-item-value">
              {statusLoading ? "..." : (systemStatus && systemStatus.storage) || "—"}
            </div>
            <div className="summary-item-label">Dung lượng</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon warning"><Users size={20} /></div>
            </div>
            <div className="summary-item-value">
              {statusLoading ? "..." : (systemStatus && systemStatus.activeUsers) || 0}
            </div>
            <div className="summary-item-label">Người dùng hoạt động</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon success"><CheckCircle size={20} /></div>
            </div>
            <div className="summary-item-value">
              {statusLoading ? "..." : (systemStatus && systemStatus.version) || "—"}
            </div>
            <div className="summary-item-label">Phiên bản</div>
          </div>
        </div>

        <div className="settings-grid">
          {/* Sidebar */}
          <div className="settings-sidebar" style={{ padding: "16px" }}>
            <p style={{
              fontSize: "11px", fontWeight: 700,
              color: "var(--muted-foreground)", textTransform: "uppercase",
              letterSpacing: "0.5px", marginBottom: "12px",
            }}>
              Quản lý cài đặt
            </p>
            <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { icon: Settings, label: "Cài đặt chung", sub: "Ngôn ngữ, múi giờ", href: "#general", color: "#b91c1c", active: true },
                { icon: User, label: "Tài khoản", sub: "Thông tin cá nhân", href: "#account", color: "#2563eb" },

                { icon: Shield, label: "Bảo mật", sub: "Mật khẩu, 2FA", href: "#security", color: "#16a34a" },
              ].map(function (item, idx) {
                var IconComp = item.icon
                return (
                  <a
                    key={idx}
                    href={item.href}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "14px 16px", borderRadius: "12px",
                      background: item.active
                        ? "linear-gradient(135deg, rgba(185,28,28,0.1) 0%, rgba(185,28,28,0.05) 100%)"
                        : "var(--card)",
                      border: item.active
                        ? "1px solid rgba(185,28,28,0.2)"
                        : "1px solid var(--border)",
                      textDecoration: "none", color: "inherit",
                    }}
                  >
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "10px",
                      background: "rgba(" + (item.color === "#b91c1c" ? "185,28,28" : item.color === "#2563eb" ? "37,99,235" : item.color === "#f59e0b" ? "245,158,11" : item.color === "#16a34a" ? "22,163,74" : "139,92,246") + ",0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <IconComp size={20} style={{ color: item.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>
                        {item.label}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                        {item.sub}
                      </p>
                    </div>
                  </a>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="settings-content">
            {/* General Settings */}
            <div className="card" id="general">
              <div className="card-header">
                <h2 className="card-title"><Globe size={20} /> Cài đặt chung</h2>
              </div>
              <div className="card-content">
                {settingsLoading ? (
                  <div style={{ color: "var(--muted-foreground)", padding: "1rem" }}>Đang tải...</div>
                ) : (
                  <form onSubmit={handleSaveGeneral} className="settings-form">
                    <div className="form-group">
                      <label className="form-label">Tên hệ thống</label>
                      <input
                        type="text"
                        className="form-input"
                        value={generalForm.system_name}
                        onChange={function (e) {
                          setGeneralForm(function (prev) {
                            return Object.assign({}, prev, { system_name: e.target.value })
                          })
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Học kỳ hiện tại</label>
                      <input
                        type="text"
                        className="form-input"
                        value={generalForm.current_semester}
                        onChange={function (e) {
                          setGeneralForm(function (prev) {
                            return Object.assign({}, prev, { current_semester: e.target.value })
                          })
                        }}
                        placeholder="VD: HK2 (2024-2025)"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Giá 1 tín chỉ (VNĐ)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={generalForm.credit_price}
                        onChange={function (e) {
                          setGeneralForm(function (prev) {
                            return Object.assign({}, prev, { credit_price: e.target.value })
                          })
                        }}
                        placeholder="VD: 450000"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Ngôn ngữ</label>
                        <select
                          className="form-select"
                          value={generalForm.language}
                          onChange={function (e) {
                            setGeneralForm(function (prev) {
                              return Object.assign({}, prev, { language: e.target.value })
                            })
                          }}
                        >
                          <option value="vi">Tiếng Việt</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Múi giờ</label>
                        <select
                          className="form-select"
                          value={generalForm.timezone}
                          onChange={function (e) {
                            setGeneralForm(function (prev) {
                              return Object.assign({}, prev, { timezone: e.target.value })
                            })
                          }}
                        >
                          <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={savingGeneral}
                      >
                        <Save size={16} />
                        {savingGeneral ? "Đang lưu..." : "Lưu cài đặt"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Account Settings */}
            <div className="card" id="account">
              <div className="card-header">
                <h2 className="card-title"><User size={20} /> Thông tin tài khoản</h2>
              </div>
              <div className="card-content">
                {settingsLoading ? (
                  <div style={{ color: "var(--muted-foreground)", padding: "1rem" }}>Đang tải...</div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="settings-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Họ và tên</label>
                        <input
                          type="text"
                          className="form-input"
                          value={profileForm.full_name}
                          onChange={function (e) {
                            setProfileForm(function (prev) {
                              return Object.assign({}, prev, { full_name: e.target.value })
                            })
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-input"
                          value={profileForm.email}
                          onChange={function (e) {
                            setProfileForm(function (prev) {
                              return Object.assign({}, prev, { email: e.target.value })
                            })
                          }}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Số điện thoại</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={profileForm.phone}
                        onChange={function (e) {
                          setProfileForm(function (prev) {
                            return Object.assign({}, prev, { phone: e.target.value })
                          })
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={savingProfile}
                      >
                        <Save size={16} />
                        {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>



            {/* Security Settings */}
            <div className="card" id="security">
              <div className="card-header">
                <h2 className="card-title"><Shield size={20} /> Bảo mật</h2>
              </div>
              <div className="card-content">
                <div style={{ display: "grid", gap: "12px" }}>
                  <div style={{
                    padding: "16px 20px", borderRadius: "12px",
                    border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{
                        width: "44px", height: "44px", borderRadius: "10px",
                        background: "rgba(220,38,38,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Key size={22} style={{ color: "#dc2626" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "2px" }}>
                          Đổi mật khẩu
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                          Cập nhật mật khẩu đăng nhập
                        </p>
                      </div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowPasswordModal(true)}>Đổi mật khẩu</button>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "var(--card)", padding: "2rem", borderRadius: "0.75rem", width: 450, maxWidth: "90%" }}>
              <h3 style={{ fontWeight: 700, margin: "0 0 1.5rem 0", fontSize: "18px" }}>Đổi mật khẩu</h3>
              <form onSubmit={handleChangePassword}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    required 
                    value={passwordForm.old_password} 
                    onChange={e => setPasswordForm({...passwordForm, old_password: e.target.value})} 
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>Mật khẩu mới</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    required 
                    value={passwordForm.new_password} 
                    onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} 
                  />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>Xác nhận mật khẩu mới</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    required 
                    value={passwordForm.confirm_password} 
                    onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} 
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowPasswordModal(false)} disabled={changingPassword}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                    {changingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
