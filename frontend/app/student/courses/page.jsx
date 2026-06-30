"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { useApi, useMutation } from "@/hooks/use-api"
import { studentCourseService } from "@/lib/services/studentService"
import {
  BookOpen, Search, CheckCircle, Clock, Plus, X, GraduationCap, MapPin, User
} from "lucide-react"

export default function StudentCoursesPage() {
  const [activeTab, setActiveTab] = useState("available") // 'available' or 'registered'
  const [searchInput, setSearchInput] = useState("")

  const { data: availableCourses, loading: availableLoading, refetch: refetchAvailable } = useApi(
    studentCourseService.getAvailable,
    [],
    { defaultData: [] }
  )

  const { data: registeredCourses, loading: registeredLoading, refetch: refetchRegistered } = useApi(
    studentCourseService.getMyRegistrations,
    [],
    { defaultData: [] }
  )

  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const { mutate: registerCourse, loading: registering } = useMutation(
    studentCourseService.register,
    {
      onSuccess: function (res) {
        setSuccessMsg(res?.message || "Đăng ký thành công")
        refetchAvailable()
        refetchRegistered()
        setTimeout(() => setSuccessMsg(""), 3000)
      },
      onError: function (err) {
        setErrorMsg(err.message || "Lỗi đăng ký môn học")
        setTimeout(() => setErrorMsg(""), 3000)
      },
    }
  )

  const { mutate: cancelCourse, loading: canceling } = useMutation(
    studentCourseService.cancel,
    {
      onSuccess: function (res) {
        setSuccessMsg(res?.message || "Hủy đăng ký thành công")
        refetchAvailable()
        refetchRegistered()
        setTimeout(() => setSuccessMsg(""), 3000)
      },
      onError: function (err) {
        setErrorMsg(err.message || "Lỗi hủy đăng ký")
        setTimeout(() => setErrorMsg(""), 3000)
      },
    }
  )

  const filteredAvailable = (availableCourses || []).filter(c => 
    c.name?.toLowerCase().includes(searchInput.toLowerCase()) || 
    c.course_code?.toLowerCase().includes(searchInput.toLowerCase())
  )

  const registeredActive = (registeredCourses || []).filter(c => c.registration_status !== 'Đã hủy')

  return (
    <div className="dashboard-content">
      <Header title="Đăng ký học phần" />

      <div className="dashboard-body">
        {successMsg && (
          <div style={{ padding: "0.75rem 1rem", background: "#dcfce7", border: "1px solid #16a34a", borderRadius: "0.5rem", color: "#166534", fontSize: "0.875rem", marginBottom: "1rem" }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ padding: "0.75rem 1rem", background: "#fee2e2", border: "1px solid #dc2626", borderRadius: "0.5rem", color: "#991b1b", fontSize: "0.875rem", marginBottom: "1rem" }}>
            {errorMsg}
          </div>
        )}

        <div className="tabs" style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" }}>
          <button 
            className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
            style={{ padding: "0.75rem 1rem", borderBottom: activeTab === 'available' ? "2px solid var(--primary)" : "none", color: activeTab === 'available' ? "var(--primary)" : "var(--muted-foreground)", fontWeight: activeTab === 'available' ? 600 : 400, background: "none", border: "none", cursor: "pointer" }}
            onClick={() => setActiveTab('available')}
          >
            Đăng ký môn học
          </button>
          <button 
            className={`tab-btn ${activeTab === 'registered' ? 'active' : ''}`}
            style={{ padding: "0.75rem 1rem", borderBottom: activeTab === 'registered' ? "2px solid var(--primary)" : "none", color: activeTab === 'registered' ? "var(--primary)" : "var(--muted-foreground)", fontWeight: activeTab === 'registered' ? 600 : 400, background: "none", border: "none", cursor: "pointer" }}
            onClick={() => setActiveTab('registered')}
          >
            Môn đã đăng ký <span style={{ background: "var(--primary)", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", marginLeft: "8px" }}>{registeredActive.length}</span>
          </button>
        </div>

        {activeTab === 'available' && (
          <div className="card">
            <div className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
                <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} size={16} />
                <input 
                  type="text" 
                  placeholder="Tìm mã, tên môn học..." 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px 8px 36px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--background)", fontSize: "14px" }}
                />
              </div>
            </div>
            <div className="card-body">
              {availableLoading ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>Đang tải...</div>
              ) : filteredAvailable.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>Không tìm thấy môn học nào đang mở.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "var(--accent)", color: "var(--muted-foreground)", textAlign: "left" }}>
                        <th style={{ padding: "12px 16px", fontWeight: 600 }}>Môn học</th>
                        <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tín chỉ</th>
                        <th style={{ padding: "12px 16px", fontWeight: 600 }}>Giảng viên</th>
                        <th style={{ padding: "12px 16px", fontWeight: 600 }}>Lịch học</th>
                        <th style={{ padding: "12px 16px", fontWeight: 600 }}>Sĩ số</th>
                        <th style={{ padding: "12px 16px", fontWeight: 600 }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAvailable.map(course => {
                        const isFull = course.current_students >= course.max_students;
                        const isRegistered = registeredActive.some(r => r.course_id === course.id);
                        
                        return (
                          <tr key={course.id} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontWeight: 600 }}>{course.name}</div>
                              <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{course.course_code}</div>
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: 600 }}>{course.credits}</td>
                            <td style={{ padding: "12px 16px" }}>{course.instructor_name || "—"}</td>
                            <td style={{ padding: "12px 16px" }}>
                              {course.day_of_week ? (
                                <div style={{ fontSize: "12px" }}>
                                  <div>{course.day_of_week} ({course.start_time} - {course.end_time})</div>
                                  <div style={{ color: "var(--muted-foreground)" }}>P. {course.room}</div>
                                </div>
                              ) : "—"}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ color: isFull ? "#dc2626" : "inherit", fontWeight: isFull ? 600 : 400 }}>
                                {course.current_students}/{course.max_students}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {isRegistered ? (
                                <span style={{ color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                                  <CheckCircle size={14} /> Đã ĐK
                                </span>
                              ) : isFull ? (
                                <span style={{ color: "#dc2626", fontWeight: 600 }}>Đã đầy</span>
                              ) : (
                                <button 
                                  className="btn btn-primary btn-sm"
                                  onClick={() => registerCourse(course.id)}
                                  disabled={registering}
                                >
                                  <Plus size={14} style={{ marginRight: 4 }}/> Đăng ký
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'registered' && (
          <div className="card">
            <div className="card-body">
              {registeredLoading ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>Đang tải...</div>
              ) : registeredActive.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>Bạn chưa đăng ký môn học nào.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "var(--accent)", color: "var(--muted-foreground)", textAlign: "left" }}>
                        <th style={{ padding: "12px 16px", fontWeight: 600 }}>Môn học</th>
                        <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tín chỉ</th>
                        <th style={{ padding: "12px 16px", fontWeight: 600 }}>Giảng viên</th>
                        <th style={{ padding: "12px 16px", fontWeight: 600 }}>Lịch học</th>
                        <th style={{ padding: "12px 16px", fontWeight: 600 }}>Trạng thái môn</th>
                        <th style={{ padding: "12px 16px", fontWeight: 600 }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredActive.map(course => (
                        <tr key={course.registration_id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 600 }}>{course.name}</div>
                            <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{course.course_code}</div>
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{course.credits}</td>
                          <td style={{ padding: "12px 16px" }}>{course.instructor_name || "—"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            {course.day_of_week ? (
                              <div style={{ fontSize: "12px" }}>
                                <div>{course.day_of_week} ({course.start_time} - {course.end_time})</div>
                                <div style={{ color: "var(--muted-foreground)" }}>P. {course.room}</div>
                              </div>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span className={`badge ${course.course_status === 'Đang mở' ? 'badge-primary' : 'badge-warning'}`}>
                              {course.course_status}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {course.course_status === 'Đang mở' ? (
                              <button 
                                className="btn btn-outline btn-sm"
                                style={{ color: "#dc2626", borderColor: "#dc2626" }}
                                onClick={() => {
                                  if(confirm("Bạn có chắc muốn hủy đăng ký môn này?")) {
                                    cancelCourse(course.course_id)
                                  }
                                }}
                                disabled={canceling}
                              >
                                <X size={14} style={{ marginRight: 4 }}/> Hủy đăng ký
                              </button>
                            ) : (
                              <span style={{ color: "var(--muted-foreground)", fontSize: "12px" }}>Đã khóa sổ</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
