"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import { dashboardService } from "@/lib/services/adminService"
import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Calendar,
  UserPlus,
  FileText,
  Settings,
  Bell,
  Building
} from "lucide-react"

const COLORS = ["#b91c1c", "#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca"];

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  
  const { data: statsData } = useApi(dashboardService.getStats, [], { defaultData: null })
  const { data: facultyStats } = useApi(dashboardService.getDistribution, [], { defaultData: [] })

  const totalStudents = facultyStats.reduce((sum, f) => sum + f.student_count, 0)


  return (
    <div className="dashboard-content">
      <Header title="Tổng quan hệ thống" />
      
      <div className="dashboard-body">
        {/* Welcome Banner */}
        <div className="admin-welcome-banner">
          <div className="admin-welcome-content">
            <div className="admin-welcome-text">
              <h1>Chào mừng trở lại, {user?.name || "Admin"}!</h1>
              <p>Hệ thống quản lý sinh viên PTIT — Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}</p>
            </div>
            <div className="admin-welcome-stats">
              <div className="admin-welcome-stat">
                <span className="admin-welcome-stat-value">{statsData?.uptime || 0}%</span>
                <span className="admin-welcome-stat-label">Uptime</span>
              </div>
              <div className="admin-welcome-stat">
                <span className="admin-welcome-stat-value">{statsData?.onlineUsers || 0}</span>
                <span className="admin-welcome-stat-label">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Tổng sinh viên"
            value={(statsData?.totalStudents || 0).toLocaleString()}
            description="Đang theo học"
            icon={Users}
            variant="primary"
            onClick={() => router.push('/admin/students')}
          />
          <StatCard
            title="Giảng viên"
            value={(statsData?.totalInstructors || 0).toLocaleString()}
            description="Đang giảng dạy"
            icon={GraduationCap}
            onClick={() => router.push('/admin/teachers')}
          />
          <StatCard
            title="Môn học"
            value={(statsData?.totalCourses || 0).toLocaleString()}
            description="Học kỳ này"
            icon={BookOpen}
            onClick={() => router.push('/admin/courses')}
          />
          <StatCard
            title="Tỷ lệ tốt nghiệp"
            value={`${statsData?.graduationRate || 0}%`}
            description="Tất cả thời gian"
            icon={TrendingUp}
          />
        </div>

        {/* Faculty Stats & Quick Actions */}
        <div className="admin-bottom-grid">
          {/* Faculty Distribution */}
          <div 
            className="card cursor-pointer" 
            onClick={() => router.push('/admin/departments')}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="card-header">
              <h2 className="card-title">
                <Building className="card-title-icon" />
                Phân bố sinh viên theo khoa
              </h2>
            </div>
            <div className="card-content">
              <div className="faculty-chart">
                {facultyStats.map((faculty, index) => {
                  const color = COLORS[index % COLORS.length];
                  return (
                    <div key={index} className="faculty-item">
                      <div className="faculty-info">
                        <span className="faculty-name">{faculty.department_name}</span>
                        <span className="faculty-count">{faculty.student_count.toLocaleString()} SV</span>
                      </div>
                      <div className="faculty-bar-container">
                        <div 
                          className="faculty-bar" 
                          style={{ 
                            width: `${totalStudents > 0 ? (faculty.student_count / totalStudents) * 100 : 0}%`,
                            backgroundColor: color 
                          }}
                        ></div>
                      </div>
                      <span className="faculty-percent">
                        {faculty.percentage}%
                      </span>
                    </div>
                  )
                })}
                {facultyStats.length === 0 && (
                  <p className="text-center text-muted py-2">Chưa có dữ liệu</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Settings className="card-title-icon" />
                Thao tác nhanh
              </h2>
            </div>
            <div className="card-content">
              <div className="quick-actions-grid">
                <button className="quick-action-btn quick-action-primary" onClick={() => router.push('/admin/students')}>
                  <UserPlus size={24} />
                  <span>Quản lý sinh viên</span>
                </button>
                <button className="quick-action-btn" onClick={() => router.push('/admin/teachers')}>
                  <GraduationCap size={24} />
                  <span>Quản lý giảng viên</span>
                </button>
                <button className="quick-action-btn" onClick={() => router.push('/admin/courses')}>
                  <BookOpen size={24} />
                  <span>Quản lý môn học</span>
                </button>
                <button className="quick-action-btn" onClick={() => router.push('/admin/schedule')}>
                  <Calendar size={24} />
                  <span>Thời khóa biểu</span>
                </button>
                <button className="quick-action-btn" onClick={() => router.push('/admin/reports')}>
                  <FileText size={24} />
                  <span>Báo cáo</span>
                </button>
                <button className="quick-action-btn" onClick={() => router.push('/admin/notifications')}>
                  <Bell size={24} />
                  <span>Thông báo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
