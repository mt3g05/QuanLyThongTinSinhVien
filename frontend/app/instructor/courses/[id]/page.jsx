"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle, AlertCircle, Search, User } from "lucide-react"
import apiClient from "@/lib/api"

export default function CourseStudents() {
  const params = useParams()
  const router = useRouter()
  
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const res = await apiClient.get(`/instructor/courses/${params.id}/students`)
      if (res.data) {
        setStudents(res.data)
      }
    } catch (error) {
      console.error("Lỗi:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.student_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="dashboard-content">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/instructor/courses" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)", transition: "all 0.2s" }} className="hover:bg-accent">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "0.25rem" }}>Danh sách Sinh viên</h1>
          <p style={{ color: "var(--muted-foreground)" }}>Xem danh sách và điểm số của sinh viên trong lớp học phần</p>
        </div>
      </div>

      <div style={{ background: "var(--card)", borderRadius: "1rem", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", background: "var(--secondary)", padding: "0.5rem 1rem", borderRadius: "2rem" }}>
              Tổng số: <strong style={{ color: "var(--foreground)" }}>{students.length}</strong> sinh viên
            </span>
          </div>
          
          <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
            <Search style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} size={16} />
            <input 
              type="text" 
              placeholder="Tìm kiếm sinh viên..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "0.625rem 1rem 0.625rem 2.5rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", fontSize: "0.875rem" }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(37,99,235,0.02)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sinh viên</th>
                <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Lớp</th>
                <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Điểm CC</th>
                <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Điểm GK</th>
                <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Điểm Thi</th>
                <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <tr key={student.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} className="hover:bg-slate-50">
                  <td style={{ padding: "1rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }}>
                        <User size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--foreground)", fontSize: "0.875rem" }}>{student.full_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{student.student_code}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>{student.class_code}</td>
                  <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", textAlign: "right" }}>{student.attendance_score ?? '-'}</td>
                  <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", textAlign: "right" }}>{student.midterm_score ?? '-'}</td>
                  <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, textAlign: "right", color: "var(--foreground)" }}>{student.final_score ?? '-'}</td>
                  <td style={{ padding: "1rem 1.5rem" }}>
                    {student.status === 'Đã duyệt' ? (
                      <span style={{ padding: "0.25rem 0.75rem", borderRadius: "2rem", fontSize: "0.75rem", fontWeight: 600, background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>Đã duyệt</span>
                    ) : student.status === 'Chờ duyệt' ? (
                      <span style={{ padding: "0.25rem 0.75rem", borderRadius: "2rem", fontSize: "0.75rem", fontWeight: 600, background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>Chờ duyệt</span>
                    ) : (
                      <span style={{ padding: "0.25rem 0.75rem", borderRadius: "2rem", fontSize: "0.75rem", fontWeight: 600, background: "var(--secondary)", color: "var(--muted-foreground)" }}>Chưa có điểm</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>Không tìm thấy sinh viên nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
