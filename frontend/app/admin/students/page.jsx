"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { useApi, usePaginatedApi, useMutation } from "@/hooks/use-api"
import { adminStudentService, adminDepartmentService, adminMajorService, classService, cohortService } from "@/lib/services/adminService"
import { exportToCSV } from "@/lib/utils/exportUtils"
import {
  Users, Search, Plus, Eye, Edit, Trash2, Download, Upload,
  ChevronLeft, ChevronRight, GraduationCap
} from "lucide-react"

export default function StudentsPage() {
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [academicYearFilter, setAcademicYearFilter] = useState("")
  const [genderFilter, setGenderFilter] = useState("all")
  const [trainingSystemFilter, setTrainingSystemFilter] = useState("all")
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [viewingStudent, setViewingStudent] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    student_code: "", full_name: "", email: "", phone: "",
    date_of_birth: "", gender: "Nam", ethnicity: "Kinh", religion: "Không", 
    id_number: "", id_issue_date: "", id_issue_place: "",
    department_id: "", major_id: "", class_id: "", cohort_id: "", status: "Chờ duyệt"
  })

  // Reference data
  const { data: departments } = useApi(adminDepartmentService.getAll, [], { defaultData: [] })
  const { data: majors } = useApi(adminMajorService.getAll, [], { defaultData: [] })
  const { data: classesList } = useApi(classService.getAll, [], { defaultData: [] })
  const { data: cohorts } = useApi(cohortService.getAll, [], { defaultData: [] })

  const {
    data: students,
    pagination,
    loading,
    error,
    updateParams,
    goToPage,
    refetch,
  } = usePaginatedApi(adminStudentService.getAll, { page: 1, limit: 10 })

  const { mutate: createStudent, loading: creating } = useMutation(adminStudentService.create, {
    onSuccess: () => {
      setSuccessMsg("Thêm sinh viên thành công")
      setShowModal(false)
      refetch()
      setTimeout(() => setSuccessMsg(""), 3000)
    },
    onError: (err) => { setErrorMsg(err.message); setTimeout(() => setErrorMsg(""), 3000) }
  })

  const { mutate: updateStudent, loading: updating } = useMutation(adminStudentService.update, {
    onSuccess: () => {
      setSuccessMsg("Cập nhật sinh viên thành công")
      setShowModal(false)
      refetch()
      setTimeout(() => setSuccessMsg(""), 3000)
    },
    onError: (err) => { setErrorMsg(err.message); setTimeout(() => setErrorMsg(""), 3000) }
  })

  const { mutate: deleteStudent, loading: deleting } = useMutation(
    adminStudentService.delete,
    {
      onSuccess: function () {
        setSuccessMsg("Xóa sinh viên thành công")
        setConfirmDelete(null)
        refetch()
        setTimeout(() => setSuccessMsg(""), 3000)
      },
      onError: function (err) {
        setErrorMsg(err.message || "Lỗi khi xóa sinh viên")
        setConfirmDelete(null)
        setTimeout(() => setErrorMsg(""), 3000)
      },
    }
  )

  const openCreate = () => {
    setEditingId(null)
    setFormData({
      student_code: "", full_name: "", email: "", phone: "",
      date_of_birth: "", gender: "Nam", ethnicity: "Kinh", religion: "Không", 
      id_number: "", id_issue_date: "", id_issue_place: "",
      department_id: "", major_id: "", class_id: "", cohort_id: "", status: "Chờ duyệt"
    })
    setShowModal(true)
  }

  const openView = (s) => {
    setViewingStudent(s)
  }

  const openEdit = (s) => {
    setEditingId(s.id)
    setFormData({
      student_code: s.student_code, full_name: s.full_name, email: s.email, phone: s.phone || "",
      date_of_birth: s.date_of_birth ? s.date_of_birth.split('T')[0] : "", gender: s.gender || "Nam",
      ethnicity: s.ethnicity || "", religion: s.religion || "", 
      id_number: s.id_number || "", id_issue_date: s.id_issue_date ? s.id_issue_date.split('T')[0] : "", 
      id_issue_place: s.id_issue_place || "",
      department_id: s.department_id || "", major_id: s.major_id || "", class_id: s.class_id || "", cohort_id: s.cohort_code || s.cohort_id || "", status: s.status
    })
    setShowModal(true)
  }

  const handleExport = () => {
    if (studentList.length === 0) return alert("Không có dữ liệu để xuất")
    const exportData = studentList.map(s => ({
      "Mã SV": s.student_code,
      "Họ và tên": s.full_name,
      "Email": s.email,
      "Lớp": s.class_name || "",
      "Ngành học": s.major_name || "",
      "Khoa": s.department_name || "",
      "Trạng thái": s.status,
      "Ngày nhập học": s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString("vi-VN") : ""
    }))
    exportToCSV(exportData, "Danh_sach_sinh_vien.csv")
  }

  const downloadTemplate = () => {
    const templateData = [
      {
        "Mã SV": "B24DCCN001",
        "Họ tên": "Nguyễn Văn A",
        "Email": "b24dccn001@ptit.edu.vn",
        "Ngày sinh": "2006-01-01",
        "Giới tính": "Nam",
        "Dân tộc": "Kinh",
        "Tôn giáo": "Không",
        "Số CCCD": "012345678901",
        "Ngày cấp": "2021-01-01",
        "Nơi cấp": "Cục CSQLHC về TTXH",
        "SĐT": "0987654321",
        "Mã Lớp": "D24CQCN01-B",
        "Mã Ngành": "DCCN",
        "Mã Khoa": "CNTT",
        "Hệ đào tạo": "Chính quy",
        "Khóa": "K24"
      }
    ]
    exportToCSV(templateData, "Mau_nhap_sinh_vien.csv")
  }

  const handleImport = async (e) => {
    e.preventDefault()
    if (!importFile) return alert("Vui lòng chọn file Excel")
    
    setImporting(true)
    setImportResult(null)
    setErrorMsg("")
    
    const formData = new FormData()
    formData.append("file", importFile)
    
    try {
      const response = await adminStudentService.importExcel(formData)
      if (response.success) {
        setImportResult(response.data)
        setSuccessMsg(response.message || "Nhập dữ liệu thành công")
        refetch()
        setTimeout(() => setSuccessMsg(""), 3000)
      } else {
        setErrorMsg(response.message || "Lỗi khi nhập dữ liệu")
      }
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi nhập dữ liệu")
    } finally {
      setImporting(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) updateStudent(editingId, formData)
    else createStudent(formData)
  }

  function handleSearch(e) {
    e.preventDefault()
    updateParams({ search: searchInput })
  }

  const studentList = Array.isArray(students) ? students : []
  const totalCount = pagination ? pagination.totalItems : 0
  const currentPage = pagination ? pagination.currentPage : 1
  const totalPages = pagination ? pagination.totalPages : 1

  return (
    <div className="dashboard-content">
      <Header title="Quản lý sinh viên" />

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

        {/* Filters */}
        <div className="card">
          <div className="card-content">
            <div className="admin-toolbar">
              <div className="admin-toolbar-left" style={{ flexWrap: "wrap", gap: "10px", width: "100%" }}>
                <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                  <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: 1, maxWidth: "400px" }}>
                    <div className="search-box" style={{ width: "100%" }}>
                      <Search className="search-icon" />
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Tìm kiếm theo Tên, Mã SV, Lớp..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <button type="submit" className="btn btn-outline btn-sm">Tìm</button>
                  </form>
                  <div className="admin-toolbar-right" style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowImportModal(true)}>
                      <Upload size={16} /> Nhập Excel
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={handleExport}>
                      <Download size={16} /> Xuất CSV
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={openCreate}>
                      <Plus size={16} /> Thêm sinh viên
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", width: "100%", marginTop: "10px" }}>
                  <select
                    className="filter-select"
                    value={departmentFilter}
                    onChange={(e) => {
                      setDepartmentFilter(e.target.value)
                      updateParams({ department_id: e.target.value })
                    }}
                  >
                    <option value="">Tất cả Khoa</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>

                  <select
                    className="filter-select"
                    value={academicYearFilter}
                    onChange={(e) => {
                      setAcademicYearFilter(e.target.value)
                      updateParams({ cohort_id: e.target.value })
                    }}
                  >
                    <option value="">Tất cả Khóa</option>
                    {(cohorts || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      updateParams({ status: e.target.value })
                    }}
                  >
                    <option value="all">Tất cả Trạng thái</option>
                    <option value="Đang học">Đang học</option>
                    <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
                    <option value="Chờ duyệt">Chờ duyệt</option>
                    <option value="Đình chỉ">Đình chỉ</option>
                    <option value="Bảo lưu">Bảo lưu</option>
                  </select>

                  <select
                    className="filter-select"
                    value={genderFilter}
                    onChange={(e) => {
                      setGenderFilter(e.target.value)
                      updateParams({ gender: e.target.value })
                    }}
                  >
                    <option value="all">Tất cả Giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>

                  <select
                    className="filter-select"
                    value={trainingSystemFilter}
                    onChange={(e) => {
                      setTrainingSystemFilter(e.target.value)
                      updateParams({ training_system: e.target.value })
                    }}
                  >
                    <option value="all">Tất cả Hệ đào tạo</option>
                    <option value="Chính quy">Chính quy</option>
                    <option value="Chất lượng cao">Chất lượng cao</option>
                    <option value="Liên thông">Liên thông</option>
                    <option value="Từ xa">Từ xa</option>
                  </select>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="card" style={{ marginTop: "16px" }}>
          <div className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
              <Users size={18} style={{ marginRight: 8, verticalAlign: 'middle' }}/>
              Danh sách sinh viên
            </h3>
            <span className="badge badge-primary">{totalCount} sinh viên</span>
          </div>
          <div className="card-body" style={{ padding: "20px" }}>
            {error ? (
              <div style={{ color: "#dc2626", marginBottom: "1rem" }}>Lỗi: {error}</div>
            ) : loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)" }}>Đang tải...</div>
            ) : studentList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)" }}>Không có dữ liệu</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "var(--accent)", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px" }}>Mã SV</th>
                      <th style={{ padding: "12px 16px" }}>Họ tên</th>
                      <th style={{ padding: "12px 16px" }}>Lớp</th>
                      <th style={{ padding: "12px 16px" }}>Ngành</th>
                      <th style={{ padding: "12px 16px" }}>Trạng thái</th>
                      <th style={{ padding: "12px 16px" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentList.map(student => (
                      <tr key={student.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--primary)" }}>{student.student_code}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {student.avatar ? (
                                <img src={student.avatar} alt={student.full_name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                              ) : (
                                <GraduationCap size={16} />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{student.full_name}</div>
                              <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{student.class_name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{student.major_name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className={`badge ${student.status === "Đang học" ? "badge-success" : student.status === "Đã tốt nghiệp" ? "badge-primary" : "badge-warning"}`}>
                            {student.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button className="btn btn-outline btn-sm btn-icon" title="Chi tiết" onClick={() => openView(student)}><Eye size={14} /></button>
                            <button className="btn btn-outline btn-sm btn-icon" title="Sửa" onClick={() => openEdit(student)}><Edit size={14} /></button>
                            <button 
                              className="btn btn-outline btn-sm btn-icon" 
                              style={{ color: "#dc2626" }} 
                              title="Xóa"
                              onClick={() => setConfirmDelete(student)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                <button
                  className="btn btn-outline btn-sm btn-icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!pagination || !pagination.hasPrevPage}
                >
                  <ChevronLeft />
                </button>
                <span style={{ padding: "0.375rem 0.75rem", fontSize: "0.875rem" }}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="btn btn-outline btn-sm btn-icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!pagination || !pagination.hasNextPage}
                >
                  <ChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>

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
                Bạn có chắc muốn xóa sinh viên{" "}
                <strong>{confirmDelete.full_name}</strong> ({confirmDelete.student_code})?<br/>
                Thao tác này cũng sẽ xóa tài khoản đăng nhập của sinh viên.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button className="btn btn-outline" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                  Hủy
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: "#dc2626" }}
                  onClick={() => deleteStudent(confirmDelete.id)}
                  disabled={deleting}
                >
                  {deleting ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xem chi tiết */}
        {viewingStudent && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "var(--card)", padding: "2rem", borderRadius: "0.75rem", width: 600, maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Thông tin chi tiết sinh viên</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Mã SV:</strong> {viewingStudent.student_code}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Họ và tên:</strong> {viewingStudent.full_name}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Giới tính:</strong> {viewingStudent.gender || "Nam"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Ngày sinh:</strong> {viewingStudent.date_of_birth ? new Date(viewingStudent.date_of_birth).toLocaleDateString("vi-VN") : "—"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Dân tộc:</strong> {viewingStudent.ethnicity || "—"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Tôn giáo:</strong> {viewingStudent.religion || "—"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Số CCCD:</strong> {viewingStudent.id_number || "—"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Ngày cấp:</strong> {viewingStudent.id_issue_date ? new Date(viewingStudent.id_issue_date).toLocaleDateString("vi-VN") : "—"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Nơi cấp:</strong> {viewingStudent.id_issue_place || "—"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Số điện thoại:</strong> {viewingStudent.phone || "—"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Email:</strong> {viewingStudent.email || "—"}</p>
                </div>
                <div>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Khoa:</strong> {viewingStudent.department_name || "—"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Ngành:</strong> {viewingStudent.major_name || "—"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Lớp:</strong> {viewingStudent.class_name || "—"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Khóa:</strong> {viewingStudent.cohort_name || "—"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Hệ đào tạo:</strong> {viewingStudent.training_system || "—"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong style={{ display: "inline-block", width: "120px" }}>Trạng thái:</strong> {viewingStudent.status || "—"}</p>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-outline" onClick={() => setViewingStudent(null)}>Đóng</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Thêm/Sửa */}
        {showModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "var(--card)", padding: "2rem", borderRadius: "0.75rem", width: 600, maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>{editingId ? "Cập nhật sinh viên" : "Thêm sinh viên mới"}</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Mã SV *</label>
                    <input className="form-input" required value={formData.student_code} onChange={e => setFormData({...formData, student_code: e.target.value})} disabled={!!editingId} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Họ và tên *</label>
                    <input className="form-input" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Ngày sinh *</label>
                    <input type="date" className="form-input" required value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Giới tính *</label>
                    <select className="form-input" required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Dân tộc *</label>
                    <input className="form-input" required value={formData.ethnicity} onChange={e => setFormData({...formData, ethnicity: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Tôn giáo *</label>
                    <input className="form-input" required value={formData.religion} onChange={e => setFormData({...formData, religion: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Số CCCD *</label>
                    <input className="form-input" required value={formData.id_number} onChange={e => setFormData({...formData, id_number: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Ngày cấp CCCD *</label>
                    <input type="date" className="form-input" required value={formData.id_issue_date} onChange={e => setFormData({...formData, id_issue_date: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Nơi cấp CCCD *</label>
                    <input className="form-input" required value={formData.id_issue_place} onChange={e => setFormData({...formData, id_issue_place: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Email</label>
                    <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Số điện thoại</label>
                    <input type="tel" className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Khoa</label>
                    <select className="form-input" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value, major_id: ""})}>
                      <option value="">-- Chọn Khoa --</option>
                      {(departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Ngành học</label>
                    <select className="form-input" value={formData.major_id} onChange={e => setFormData({...formData, major_id: e.target.value})}>
                      <option value="">-- Chọn Ngành --</option>
                      {(majors || [])
                        .filter(m => !formData.department_id || String(m.department_id) === String(formData.department_id))
                        .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Lớp học</label>
                    <select className="form-input" value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})}>
                      <option value="">-- Chọn Lớp --</option>
                      {(classesList?.data || classesList || []).map(c => <option key={c.id} value={c.id}>{c.class_code}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Khóa học</label>
                    <input 
                      className="form-input" 
                      list="cohorts-list"
                      placeholder="Chọn hoặc nhập Khóa (Vd: K24)"
                      value={formData.cohort_id} 
                      onChange={e => setFormData({...formData, cohort_id: e.target.value})}
                    />
                    <datalist id="cohorts-list">
                      {(cohorts || []).map(c => <option key={c.id} value={c.code || c.name}>{c.name}</option>)}
                    </datalist>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Trạng thái</label>
                    <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Chờ duyệt">Chờ duyệt</option>
                      <option value="Đang học">Đang học</option>
                      <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
                      <option value="Bảo lưu">Bảo lưu</option>
                      <option value="Đình chỉ">Đình chỉ</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={creating || updating}>Lưu thông tin</button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Modal Nhập Excel */}
        {showImportModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "var(--card)", padding: "2rem", borderRadius: "0.75rem", width: 500, maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Nhập danh sách sinh viên từ Excel</h3>
              
              {!importResult ? (
                <form onSubmit={handleImport}>
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 14, color: "var(--muted-foreground)", marginBottom: 16 }}>
                      Vui lòng chuẩn bị file Excel (.xlsx, .csv) với các cột bắt buộc: <strong>Mã SV, Họ tên, Email, Ngày sinh, Giới tính, Dân tộc, Tôn giáo, Số CCCD, Ngày cấp, Nơi cấp</strong>.<br/>
                      Các cột tùy chọn: SĐT, Mã Lớp, Mã Ngành, Mã Khoa, Hệ đào tạo, Khóa.
                    </p>
                    <div style={{ marginBottom: 16 }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={downloadTemplate}>
                        <Download size={14} style={{ marginRight: 4 }} /> Tải file mẫu (.csv)
                      </button>
                    </div>
                    <input 
                      type="file" 
                      accept=".xlsx, .xls" 
                      className="form-input" 
                      onChange={(e) => setImportFile(e.target.files[0])} 
                      required 
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowImportModal(false)}>Hủy</button>
                    <button type="submit" className="btn btn-primary" disabled={importing}>
                      {importing ? "Đang xử lý..." : "Tải lên"}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div style={{ padding: "1rem", background: "#dcfce7", color: "#166534", borderRadius: "0.5rem", marginBottom: 16 }}>
                    <strong>Thành công:</strong> Đã nhập {importResult.successCount} sinh viên
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div style={{ padding: "1rem", background: "#fee2e2", color: "#991b1b", borderRadius: "0.5rem", maxHeight: 200, overflowY: "auto", fontSize: 14 }}>
                      <strong style={{ display: "block", marginBottom: 8 }}>Chi tiết lỗi ({importResult.errors.length}):</strong>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {importResult.errors.map((err, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                    <button type="button" className="btn btn-primary" onClick={() => { setShowImportModal(false); setImportResult(null); }}>Đóng</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
