"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import apiClient from "@/lib/api"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  Bell,
  GraduationCap,
  ClipboardList,
  BarChart3,
  CreditCard,
  User,
  LogOut,
  Building,
  MonitorPlay
} from "lucide-react"

const adminNavItems = [
  { title: "Tổng quan", href: "/admin", icon: Home },
  { title: "Quản lý sinh viên", href: "/admin/students", icon: Users },
  { title: "Quản lý giảng viên", href: "/admin/teachers", icon: GraduationCap },
  { title: "Quản lý lớp học", href: "/admin/classes", icon: ClipboardList },
  { title: "Điểm số", href: "/admin/grades", icon: FileText },
  { title: "Học phí", href: "/admin/tuition", icon: CreditCard },
  { title: "Thông báo", href: "/admin/notifications", icon: Bell },


  { title: "Khoa & Ngành", href: "/admin/departments", icon: Building },
  { title: "Khóa học", href: "/admin/cohorts", icon: BookOpen },
  { title: "Cài đặt", href: "/admin/settings", icon: Settings },
]

const studentNavItems = [
  { title: "Tổng quan", href: "/student", icon: Home },
  { title: "Thông tin cá nhân", href: "/student/profile", icon: User },
  { title: "Đăng ký học phần", href: "/student/courses", icon: BookOpen },
  { title: "Kết quả học tập", href: "/student/grades", icon: FileText },
  { title: "Học phí", href: "/student/tuition", icon: CreditCard },
  { title: "Thông báo", href: "/student/notifications", icon: Bell },
]

export function SidebarNav({ role }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [onlineStats, setOnlineStats] = useState({ students: 0, teachers: 0 });
  useEffect(() => {
    if (role === 'admin') {
      apiClient.get('/admin/dashboard/online-users')
        .then(res => {
          if (res && res.data) setOnlineStats(res.data);
        })
        .catch(err => console.error(err));
      
      const interval = setInterval(() => {
        apiClient.get('/admin/dashboard/online-users')
          .then(res => {
            if (res && res.data) setOnlineStats(res.data);
          })
          .catch(err => console.error(err));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [role]);
  const navItems = role === "admin" ? adminNavItems : studentNavItems
  
  const userInfo = user 
    ? { 
        name: user.name, 
        email: user.email || (role === "admin" ? "admin@ptit.edu.vn" : `${user.studentId?.toLowerCase()}@ptit.edu.vn`),
        avatar: user.name.split(" ").pop()?.charAt(0).toUpperCase() || "U"
      }
    : role === "admin" 
      ? { name: "Admin PTIT", email: "admin@ptit.edu.vn", avatar: "AD" }
      : { name: "Nguyễn Văn A", email: "b21dccn001@ptit.edu.vn", avatar: "NA" }

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }
  
  const confirmLogout = () => {
    logout()
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href={role === "admin" ? "/admin" : "/student"} className="sidebar-header" style={{ textDecoration: 'none' }}>
        <div className="sidebar-logo">PTIT</div>
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">PTIT</span>
          <span className="sidebar-brand-desc">Hệ thống quản lý</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon />
              {item.title}
            </Link>
          )
        })}
        
        {/* Logout Button */}
        <button 
          onClick={handleLogoutClick}
          className="sidebar-nav-item"
          style={{ marginTop: 'auto', border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', textAlign: 'left' }}
        >
          <LogOut />
          Đăng xuất
        </button>
      </nav>

      {role === "admin" && (
        <div style={{ margin: '16px 20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MonitorPlay size={14} /> Trực tuyến
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Sinh viên:</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>{onlineStats.students}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Giảng viên:</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>{onlineStats.teachers}</span>
          </div>
        </div>
      )}

      {/* User section */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{userInfo.avatar}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{userInfo.name}</span>
            <span className="sidebar-user-email">{userInfo.email}</span>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--card)", padding: "2rem", borderRadius: "0.75rem", width: 400, maxWidth: "90%", border: "1px solid var(--border)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontWeight: 700, margin: "0 0 1rem 0", fontSize: "18px", color: "var(--foreground)" }}>Xác nhận đăng xuất</h3>
            <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem", fontSize: "14px", lineHeight: "1.5" }}>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không? Các dữ liệu chưa lưu (nếu có) có thể bị mất.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ background: "#dc2626", borderColor: "#dc2626", color: "white" }}
                onClick={confirmLogout}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
