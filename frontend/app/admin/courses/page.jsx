"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, Eye, X, BookOpen, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react"
import apiClient from "@/lib/api"

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [classes, setClasses] = useState([])
  const [instructors, setInstructors] = useState([])
  
  const [majors, setMajors] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalItems: 0 })
  
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDept, setFilterDept] = useState("")
  const [filterMajor, setFilterMajor] = useState("")
  const [filterClass, setFilterClass] = useState("")

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [viewingCourse, setViewingCourse] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [formData, setFormData] = useState({
    course_code: "",
    name: "",
    credits: 3,
    department_id: "",
    major_id: "",
    class_id: "",
    instructor_id: "",
    max_students: 150,
    semester: "Học kỳ 1 năm học 2023 - 2024",
    type: "Bắt buộc"
  })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchOptions()
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [pagination.page, filterDept, filterMajor, filterClass])

  const fetchOptions = async () => {
    try {
      const [deptRes, majorRes, classRes, instRes] = await Promise.all([
        apiClient.get("/admin/departments"),
        apiClient.get("/admin/majors"),
        apiClient.get("/admin/classes?limit=1000"), // Lấy tất cả lớp
        apiClient.get("/admin/instructors?limit=1000") // Lấy tất cả giảng viên
      ])
      
      if (deptRes) {
        const d = deptRes.data || deptRes;
        setDepartments(Array.isArray(d) ? d : (d.data || d.departments || []));
      }
      if (majorRes) {
        const m = majorRes.data || majorRes;
        setMajors(Array.isArray(m) ? m : (m.data || m.majors || []));
      }
      if (classRes) {
        const c = classRes.data || classRes;
        setClasses(Array.isArray(c) ? c : (c.data || c.classes || []));
      }
      if (instRes) {
        const i = instRes.data || instRes;
        setInstructors(Array.isArray(i) ? i : (i.data || i.instructors || []));
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu phụ:", err)
    }
  }

  const fetchCourses = async () => {
    setLoading(true)
    try {
      let url = `/admin/courses?page=${pagination.page}&size=${pagination.limit}`
      if (searchTerm) url += `&search=${searchTerm}`
      if (filterDept) url += `&department_id=${filterDept}`
      if (filterMajor) url += `&major_id=${filterMajor}`
      if (filterClass) url += `&class_id=${filterClass}`

      const res = await apiClient.get(url)
      if (res && res.success) {
        setCourses(res.data || [])
        setPagination(prev => ({
          ...prev,
          totalPages: res.pagination?.totalPages || 1,
          totalItems: res.pagination?.totalItems || 0
        }))
      }
    } catch (err) {
      console.error("Lỗi tải danh sách môn học:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchCourses()
  }

  const openAddModal = () => {
    setModalMode('add')
    setFormData({
      course_code: "",
      name: "",
      credits: 3,
      department_id: "",
      major_id: "",
      class_id: "",
      instructor_id: "",
      max_students: 150,
      semester: "Học kỳ 1 năm học 2023 - 2024",
      type: "Bắt buộc"
    })
    setError("")
    setShowModal(true)
  }

  const openEditModal = (course) => {
    setModalMode('edit')
    setFormData({
      id: course.id,
      course_code: course.course_code || "",
      name: course.name || "",
      credits: course.credits || 3,
      department_id: course.department_id || "",
      major_id: course.major_id || "",
      class_id: course.class_id || "",
      instructor_id: course.instructor_id || "",
      max_students: course.max_students || 150,
      semester: course.semester || "Học kỳ 1 năm học 2023 - 2024",
      type: course.type || "Bắt buộc"
    })
    setError("")
    setShowModal(true)
  }

  const openView = (course) => {
    setViewingCourse(course)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      if (modalMode === 'add') {
        await apiClient.post("/admin/courses", formData)
        setSuccessMsg("Thêm môn học thành công!")
      } else {
        await apiClient.put(`/admin/courses/${formData.id}`, formData)
        setSuccessMsg("Cập nhật môn học thành công!")
      }
      setShowModal(false)
      fetchCourses()
      setTimeout(() => setSuccessMsg(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Đã xảy ra lỗi khi lưu")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/admin/courses/${id}`)
      setSuccessMsg("Xóa môn học thành công!")
      setConfirmDelete(null)
      fetchCourses()
      setTimeout(() => setSuccessMsg(""), 3000)
    } catch (err) {
      const reason = err.message || "Lỗi khi xóa môn học";
      window.alert("Thao tác thất bại!\n\n" + reason);
      setErrorMsg(reason);
      setConfirmDelete(null);
      setTimeout(() => setErrorMsg(""), 3000);
    }
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header" style={{ marginBottom: "20px" }}>
        <div className="dashboard-header-title">
          <h1 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={24} color="var(--primary)" />
            Quản lý Môn học
          </h1>
          <p>Quản lý danh sách các môn học / lớp học phần trong học viện</p>
        </div>
        <div className="dashboard-header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            Thêm môn học
          </button>
        </div>
      </div>

      <div className="dashboard-body">
        {successMsg && (
          <div style={{
            padding: "0.75rem 1rem", background: "#dcfce7",
            border: "1px solid #16a34a", borderRadius: "0.5rem",
            color: "#166534", fontSize: "0.875rem", marginBottom: "1rem"
          }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{
            padding: "0.75rem 1rem", background: "#fee2e2",
            border: "1px solid #dc2626", borderRadius: "0.5rem",
            color: "#991b1b", fontSize: "0.875rem", marginBottom: "1rem"
          }}>
            {errorMsg}
          </div>
        )}

      <div className="card">
        {/* Filters */}
        <div className="card-content">
          <div className="admin-toolbar" style={{ borderBottom: "none", paddingBottom: 0 }}>
            <div className="admin-toolbar-left" style={{ flexWrap: "wrap", gap: "10px", width: "100%" }}>
              <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: 1, maxWidth: "400px" }}>
                <div className="search-box" style={{ width: "100%" }}>
                  <Search className="search-icon" size={18} />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Tìm theo mã hoặc tên môn học..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
                <button type="submit" className="btn btn-outline btn-sm">Tìm</button>
              </form>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", width: "100%", marginTop: "10px" }}>
                <select 
                  className="filter-select"
                  value={filterDept}
                  onChange={e => {
                    setFilterDept(e.target.value)
                    setFilterMajor("")
                    setFilterClass("")
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                >
                  <option value="">Tất cả khoa</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                <select 
                  className="filter-select" 
                  value={filterMajor}
                  onChange={e => {
                    setFilterMajor(e.target.value)
                    setFilterClass("")
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                >
                  <option value="">Tất cả ngành</option>
                  {majors.filter(m => !filterDept || m.department_id == filterDept).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>

                <select 
                  className="filter-select" 
                  value={filterClass}
                  onChange={e => {
                    setFilterClass(e.target.value)
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                >
                  <option value="">Tất cả lớp</option>
                  {classes.filter(c => (!filterDept || c.department_id == filterDept) && (!filterMajor || c.major_id == filterMajor)).map(c => (
                    <option key={c.id} value={c.id}>{c.class_code}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>



      <div className="card" style={{ marginTop: "16px" }}>
        <div className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
            <BookOpen size={18} style={{ marginRight: 8, verticalAlign: 'middle' }}/>
            Danh sách môn học
          </h3>
          <span className="badge badge-primary">{pagination.totalItems} môn học</span>
        </div>
        
        {/* Table */}
        <div className="card-body" style={{ padding: "20px" }}>
          <div className="table-responsive">
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "var(--accent)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px" }}>Mã môn</th>
                  <th style={{ padding: "12px 16px" }}>Tên môn</th>
                  <th style={{ padding: "12px 16px" }}>Ngành / Lớp</th>
                  <th style={{ padding: "12px 16px" }}>Giảng viên</th>
                  <th style={{ padding: "12px 16px" }}>Tín chỉ</th>
                  <th style={{ padding: "12px 16px" }}>Sĩ số</th>
                  <th className="text-right" style={{ padding: "12px 16px", textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center" style={{ padding: "3rem" }}>
                      <div className="spinner"></div>
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center" style={{ padding: "3rem", color: "var(--muted-foreground)" }}>
                      Không tìm thấy môn học nào
                    </td>
                  </tr>
                ) : (
                  courses.map(course => (
                    <tr key={course.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: 600, color: "var(--primary)" }}>{course.course_code}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(37,99,235,0.1)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <BookOpen size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{course.name}</div>
                            <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{course.department_name || "-"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{course.major_name || "Chưa xếp"}</div>
                        <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{course.class_name || "-"}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {course.instructor_name ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <GraduationCap size={14} color="var(--muted-foreground)" />
                            {course.instructor_name}
                          </div>
                        ) : "-"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className="badge" style={{ background: "var(--accent)" }}>{course.credits} TC</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 600, color: course.current_students >= course.max_students ? "#dc2626" : "var(--foreground)" }}>
                            {course.current_students || 0}
                          </span>
                          <span style={{ color: "var(--muted-foreground)" }}>/ {course.max_students}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button className="btn btn-outline btn-sm btn-icon" title="Chi tiết" onClick={() => openView(course)}><Eye size={14} /></button>
                          <button className="btn btn-outline btn-sm btn-icon" title="Sửa" onClick={() => openEditModal(course)}><Edit size={14} /></button>
                          <button 
                            className="btn btn-outline btn-sm btn-icon" 
                            style={{ color: "#dc2626" }} 
                            title="Xóa"
                            onClick={() => setConfirmDelete(course)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && courses.length > 0 && pagination.totalPages > 1 && (
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
              <button
                className="btn btn-outline btn-sm btn-icon"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft />
              </button>
              <span style={{ padding: "0.375rem 0.75rem", fontSize: "0.875rem" }}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm btn-icon"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Xem chi tiết */}
      {viewingCourse && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "var(--card)", padding: "2rem", borderRadius: "0.75rem", width: 600, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Thông tin môn học</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <p style={{ margin: "8px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Mã môn:</strong> {viewingCourse.course_code}</p>
                <p style={{ margin: "8px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Tên môn:</strong> <span style={{ fontWeight: 600, color: "var(--primary)" }}>{viewingCourse.name}</span></p>
                <p style={{ margin: "8px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Số tín chỉ:</strong> {viewingCourse.credits}</p>
                <p style={{ margin: "8px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Loại môn:</strong> {viewingCourse.type}</p>
                <p style={{ margin: "8px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Sĩ số:</strong> {viewingCourse.current_students || 0} / {viewingCourse.max_students}</p>
              </div>
              <div>
                <p style={{ margin: "8px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Khoa:</strong> {viewingCourse.department_name || "—"}</p>
                <p style={{ margin: "8px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Ngành:</strong> {viewingCourse.major_name || "—"}</p>
                <p style={{ margin: "8px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Lớp HC:</strong> {viewingCourse.class_name || "—"}</p>
                <p style={{ margin: "8px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Học kỳ:</strong> {viewingCourse.semester || "—"}</p>
                <p style={{ margin: "8px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Giảng viên:</strong> {viewingCourse.instructor_name || "—"}</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-outline" onClick={() => setViewingCourse(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "var(--card)", borderRadius: "0.75rem",
            padding: "2rem", maxWidth: "400px", width: "90%"
          }}>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Xác nhận xóa</h3>
            <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
              Bạn có chắc muốn xóa môn học{" "}
              <strong>{confirmDelete.name}</strong> ({confirmDelete.course_code})?
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                style={{ background: "#dc2626" }}
                onClick={() => handleDelete(confirmDelete.id)}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "var(--card)", width: "100%", maxWidth: "800px", borderRadius: "12px", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{modalMode === 'add' ? 'Thêm môn học mới' : 'Cập nhật môn học'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: "24px", overflowY: "auto" }}>
              {error && <div style={{ padding: "12px", background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: "8px", marginBottom: "20px" }}>{error}</div>}
              
              <form id="courseForm" onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 14 }}>Mã môn học <span style={{color: "red"}}>*</span></label>
                  <input type="text" className="form-input" required value={formData.course_code} onChange={e => setFormData({...formData, course_code: e.target.value})} disabled={modalMode === 'edit'}/>
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 14 }}>Tên môn học <span style={{color: "red"}}>*</span></label>
                  <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 14 }}>Số tín chỉ</label>
                  <input type="number" className="form-input" min="1" max="10" value={formData.credits} onChange={e => setFormData({...formData, credits: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 14 }}>Loại môn học</label>
                  <select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Bắt buộc">Bắt buộc</option>
                    <option value="Tự chọn">Tự chọn</option>
                    <option value="Thể chất/QP">Thể chất/QP</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 14 }}>Khoa</label>
                  <select className="form-input" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value, major_id: "", class_id: ""})}>
                    <option value="">-- Chọn khoa --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 14 }}>Ngành</label>
                  <select className="form-input" value={formData.major_id} onChange={e => setFormData({...formData, major_id: e.target.value, class_id: ""})}>
                    <option value="">-- Chọn ngành --</option>
                    {majors.filter(m => !formData.department_id || String(m.department_id) === String(formData.department_id)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 14 }}>Lớp hành chính</label>
                  <select className="form-input" value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})}>
                    <option value="">-- Chọn lớp --</option>
                    {classes.filter(c => (!formData.department_id || String(c.department_id) === String(formData.department_id)) && (!formData.major_id || String(c.major_id) === String(formData.major_id))).map(c => <option key={c.id} value={c.id}>{c.class_code}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 14 }}>Giảng viên phụ trách</label>
                  <select className="form-input" value={formData.instructor_id} onChange={e => setFormData({...formData, instructor_id: e.target.value})}>
                    <option value="">-- Chọn giảng viên --</option>
                    {instructors.map(i => <option key={i.id} value={i.id}>{i.full_name} ({i.instructor_code})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 14 }}>Sĩ số tối đa</label>
                  <input type="number" className="form-input" min="1" value={formData.max_students} onChange={e => setFormData({...formData, max_students: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 14 }}>Học kỳ</label>
                  <input type="text" className="form-input" placeholder="Vd: Học kỳ 1 năm học 2023 - 2024" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} />
                </div>
              </form>
            </div>
            
            <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "12px", background: "var(--secondary)" }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              <button type="submit" form="courseForm" className="btn btn-primary" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thông tin"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
