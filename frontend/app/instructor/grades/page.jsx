"use client"

import { useState, useEffect, useRef } from "react"
import { Download, Upload, CheckCircle, AlertCircle, Search, User } from "lucide-react"
import * as XLSX from "xlsx"
import apiClient from "@/lib/api"

export default function InstructorGrades() {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [students, setStudents] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [message, setMessage] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse)
    } else {
      setStudents([])
    }
  }, [selectedCourse])

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

  const fetchStudents = async (courseId) => {
    setLoadingStudents(true)
    setMessage(null)
    try {
      const res = await apiClient.get(`/instructor/courses/${courseId}/students`)
      if (res.data) {
        setStudents(res.data)
      }
    } catch (error) {
      console.error("Lỗi:", error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const exportToExcel = () => {
    if (!students || students.length === 0) {
      setMessage({ type: 'error', text: 'Không có dữ liệu sinh viên để xuất' })
      return
    }

    const course = courses.find(c => c.id.toString() === selectedCourse)
    const courseName = course?.name || "LopHocPhan"
    const className = course?.class_name || ""

    // Chuẩn bị dữ liệu xuất - phải đúng thứ tự cột để backend đọc
    const excelData = students.map((s) => ({
      "Mã Sinh viên": s.student_code,
      "Mã Môn học": course?.course_code || "",
      "Chuyên cần": s.attendance_score != null ? s.attendance_score : "",
      "Giữa kỳ": s.midterm_score != null ? s.midterm_score : "",
      "Cuối kỳ": s.final_score != null ? s.final_score : "",
      "Họ tên (Không sửa)": s.full_name,
      "Lớp (Không sửa)": s.class_code
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData, {
      header: ["Mã Sinh viên", "Mã Môn học", "Chuyên cần", "Giữa kỳ", "Cuối kỳ", "Họ tên (Không sửa)", "Lớp (Không sửa)"]
    })
    
    // Auto-fit columns
    const wscols = [
      {wch: 5}, {wch: 15}, {wch: 25}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 15}
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "BangDiem")

    let filename = `BangDiem_${courseName.replace(/\s+/g, '_')}`
    if (className) filename += `_${className}`
    filename += `.xlsx`

    XLSX.writeFile(workbook, filename)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !selectedCourse) return

    setUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append("file", file)
    
    // Lấy mã học kỳ đúng định dạng của DB (VD: HK2 (2024-2025)) thay vì tên hiển thị
    const course = courses.find(c => c.id.toString() === selectedCourse)
    if (course && course.semester_code) {
      formData.append("semester", course.semester_code)
    } else {
      formData.append("semester", "HK1 (2023-2024)")
    }

    try {
      const data = await apiClient.postFormData("/instructor/grades/import", formData)
      
      if (data.success) {
        const result = data.data;
        if (result && result.errorCount > 0) {
          setMessage({ type: 'error', text: `Thành công: ${result.successCount}. Lỗi: ${result.errorCount}. Chi tiết: ${result.errors[0] || 'Kiểm tra lại dữ liệu'}` })
        } else {
          setMessage({ type: 'success', text: `Import thành công ${result ? result.successCount : ''} điểm!` })
        }
        fetchStudents(selectedCourse) // Reload list
      } else {
        setMessage({ type: 'error', text: data.message || 'Lỗi khi import điểm' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || "Lỗi kết nối server" })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "0.5rem" }}>Quản lý Điểm</h1>
        <p style={{ color: "var(--muted-foreground)" }}>Lựa chọn lớp học phần, xuất file mẫu và cập nhật điểm số</p>
      </div>

      {message && (
        <div style={{ 
          padding: "1rem", 
          borderRadius: "0.5rem", 
          marginBottom: "1.5rem",
          display: "flex", 
          alignItems: "center", 
          gap: "0.75rem",
          background: message.type === 'success' ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          color: message.type === 'success' ? "#10b981" : "#ef4444",
          border: `1px solid ${message.type === 'success' ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`
        }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Control Panel */}
      <div style={{ background: "var(--card)", borderRadius: "1rem", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          
          {/* Select Course */}
          <div style={{ flex: "1", minWidth: "250px" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.5rem" }}>
              Lớp học phần
            </label>
            <select 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{ width: "100%", padding: "0.625rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", fontSize: "0.875rem" }}
            >
              <option value="">-- Chọn lớp học phần --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.course_code} - {c.name} {c.class_name ? `(${c.class_name})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button 
              onClick={exportToExcel}
              disabled={!selectedCourse || students.length === 0}
              className="btn btn-outline"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: (!selectedCourse || students.length === 0) ? 0.5 : 1 }}
            >
              <Download size={16} />
              Xuất File Mẫu
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              style={{ display: 'none' }}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedCourse || uploading}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: (!selectedCourse || uploading) ? 0.5 : 1 }}
            >
              <Upload size={16} />
              {uploading ? "Đang xử lý..." : "Nhập Điểm Excel"}
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      {selectedCourse && (
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

          <div style={{ overflowX: "auto", position: "relative", minHeight: loadingStudents ? "200px" : "auto" }}>
            {loadingStudents ? (
               <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.5)", zIndex: 10 }}>
                 <div className="spinner"></div>
               </div>
            ) : null}

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
      )}
    </div>
  )
}
