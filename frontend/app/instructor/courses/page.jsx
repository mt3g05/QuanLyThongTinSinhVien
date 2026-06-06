"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Users, Calendar, ArrowRight } from "lucide-react"
import apiClient from "@/lib/api"

export default function InstructorCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get("/instructor/courses")
      if (res.data) {
        setCourses(res.data)
      }
    } catch (error) {
      console.error("Lỗi:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="dashboard-content">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "0.5rem" }}>Lớp học phần</h1>
        <p style={{ color: "var(--muted-foreground)" }}>Danh sách các lớp học phần bạn đang phụ trách giảng dạy</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {courses.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: "3rem", textAlign: "center", background: "var(--card)", borderRadius: "1rem", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
            Hiện tại bạn không phụ trách môn học nào.
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} style={{ background: "var(--card)", borderRadius: "1rem", border: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column", transition: "all 0.2s" }}>
              <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", background: "rgba(37,99,235,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <span style={{ padding: "0.25rem 0.75rem", background: "rgba(37,99,235,0.1)", color: "#2563eb", fontSize: "0.75rem", fontWeight: 600, borderRadius: "2rem" }}>
                    {course.course_code}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "var(--muted-foreground)", background: "var(--secondary)", padding: "0.25rem 0.5rem", borderRadius: "0.5rem" }}>
                    <Calendar size={12} /> {course.semester_name}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.25rem", lineHeight: 1.4 }}>{course.name}</h3>
                <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>
                  <div style={{ marginBottom: "0.25rem" }}>{course.department_name || "-"}</div>
                  <div style={{ fontWeight: 500 }}>{course.major_name || "-"} • {course.class_name || "-"}</div>
                </div>
              </div>
              <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                    <BookOpen size={16} /> 
                    <span><strong style={{ color: "var(--foreground)" }}>{course.credits}</strong> Tín chỉ</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                    <Users size={16} /> 
                    <span><strong style={{ color: "var(--foreground)" }}>{course.current_students}</strong> Sinh viên</span>
                  </div>
                </div>
                
                <Link href={`/instructor/courses/${course.id}`} className="btn btn-outline" style={{ width: "100%", justifyContent: "center", gap: "0.5rem" }}>
                  Xem danh sách sinh viên
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
