
"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { SimpleBarChart, DonutChart, HorizontalBarChart } from "@/components/dashboard/charts"
import { useApi, usePaginatedApi, useMutation } from "@/hooks/use-api"
import { instructorService, adminDepartmentService } from "@/lib/services/adminService"
import { exportToCSV } from "@/lib/utils/exportUtils"
import {
  GraduationCap, Search, Plus, Download,
  Eye, Edit, Trash2, TrendingUp, Users,
  BookOpen, Award, Building, Clock, ChevronLeft, ChevronRight
} from "lucide-react"

export default function TeachersPage() {
  const [searchInput, setSearchInput] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [degreeFilter, setDegreeFilter] = useState("all")
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleteErrorPopup, setDeleteErrorPopup] = useState(null)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    instructor_code: "", full_name: "", email: "", phone: "",
    degree: "Thạc sĩ", department_id: "", status: "Đang dạy"
  })

  const { data: departments } = useApi(adminDepartmentService.getAll, [], { defaultData: [] })

  const {
    data: teachers,
    pagination,
    loading,
    error,
    updateParams,
    goToPage,
    refetch,
  } = usePaginatedApi(instructorService.getAll, { page: 1, limit: 10 })

  const { data: stats, loading: statsLoading } = useApi(
    instructorService.getStats,
    [],
    { defaultData: {} }
  )

  const { mutate: createInstructor, loading: creating } = useMutation(instructorService.create, {
    onSuccess: () => {
      setSuccessMsg("Thêm giảng viên thành công")
      setShowModal(false)
      refetch()
      setTimeout(() => setSuccessMsg(""), 3000)
    },
    onError: (err) => { setErrorMsg(err.message); setTimeout(() => setErrorMsg(""), 3000) }
  })

  const { mutate: updateInstructor, loading: updating } = useMutation(instructorService.update, {
    onSuccess: () => {
      setSuccessMsg("Cập nhật giảng viên thành công")
      setShowModal(false)
      refetch()
      setTimeout(() => setSuccessMsg(""), 3000)
    },
    onError: (err) => { setErrorMsg(err.message); setTimeout(() => setErrorMsg(""), 3000) }
  })

  const { mutate: deleteInstructor, loading: deleting } = useMutation(
    instructorService.delete,
    {
      onSuccess: function () {
        setSuccessMsg("Xóa giảng viên thành công")
        setConfirmDelete(null)
        refetch()
        setTimeout(function () { setSuccessMsg("") }, 3000)
      },
      onError: function (err) {
        setDeleteErrorPopup(err.message || "Lỗi khi xóa giảng viên")
        setConfirmDelete(null)
      },
    }
  )

  function handleSearch(e) {
    e.preventDefault()
    updateParams({ search: searchInput })
  }

  function handleDeptChange(e) {
    var val = e.target.value
    setDepartmentFilter(val)
    updateParams({ department_id: val === "all" ? undefined : val })
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData({
      instructor_code: "", full_name: "", email: "", phone: "",
      degree: "Thạc sĩ", department_id: "", status: "Đang dạy"
    })
    setShowModal(true)
  }

  const openEdit = (t) => {
    setEditingId(t.id)
    setFormData({
      instructor_code: t.instructor_code, full_name: t.full_name, email: t.email, phone: t.phone || "",
      degree: t.degree || "Thạc sĩ", department_id: t.department_id || "", status: t.status
    })
    setShowModal(true)
  }

  const handleExport = () => {
    if (teacherList.length === 0) return alert("Không có dữ liệu để xuất")
    const exportData = teacherList.map(t => ({
      "Mã GV": t.instructor_code,
      "Họ và tên": t.full_name,
      "Email": t.email,
      "Khoa": t.department_name || "",
      "Học vị": t.degree || "",
      "Trạng thái": t.status
    }))
    exportToCSV(exportData, "Danh_sach_giang_vien.csv")
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) updateInstructor(editingId, formData)
    else createInstructor(formData)
  }

  var teacherList = Array.isArray(teachers) ? teachers : []
  var totalCount = pagination ? pagination.totalItems : 0
  var currentPage = pagination ? pagination.currentPage : 1
  var totalPages = pagination ? pagination.totalPages : 1

  var degreeData = Array.isArray(stats && stats.degreeDistribution)
    ? stats.degreeDistribution.map(function (d) {
        return { name: d.degree, value: d.count, color: "#b91c1c" }
      })
    : []

  var deptData = Array.isArray(stats && stats.departmentDistribution)
    ? stats.departmentDistribution.map(function (d) {
        return { name: d.department_name, teachers: d.count }
      })
    : []

  return (
    <div className="dashboard-content">
      <Header title="Quản lý giảng viên" />

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

        {/* Summary Stats */}
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon primary">
                <GraduationCap size={20} />
              </div>
            </div>
            <div className="summary-item-value">
              {statsLoading ? "..." : (stats && stats.total) || 0}
            </div>
            <div className="summary-item-label">Tổng giảng viên</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon success">
                <Users size={20} />
              </div>
            </div>
            <div className="summary-item-value">
              {statsLoading ? "..." : (stats && stats.active) || 0}
            </div>
            <div className="summary-item-label">Đang giảng dạy</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon warning">
                <Clock size={20} />
              </div>
            </div>
            <div className="summary-item-value">
              {statsLoading ? "..." : (stats && stats.onLeave) || 0}
            </div>
            <div className="summary-item-label">Nghỉ phép</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon info">
                <Award size={20} />
              </div>
            </div>
            <div className="summary-item-value">
              {statsLoading ? "..." : (stats && stats.professors) || 0}
            </div>
            <div className="summary-item-label">GS/PGS</div>
          </div>
        </div>

        {/* Charts */}
        <div className="data-grid-responsive" style={{ marginTop: "24px" }}>
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">
                <Building /> Phân bố theo khoa
              </h3>
            </div>
            <div className="chart-card-body">
              {statsLoading ? (
                <div style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "2rem" }}>
                  Đang tải...
                </div>
              ) : (
                <SimpleBarChart
                  data={deptData}
                  dataKey="teachers"
                  xKey="name"
                  color="#b91c1c"
                  height={280}
                />
              )}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">
                <GraduationCap /> Trình độ học vị
              </h3>
            </div>
            <div className="chart-card-body">
              {statsLoading ? (
                <div style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "2rem" }}>
                  Đang tải...
                </div>
              ) : (
                <>
                  <DonutChart
                    data={degreeData}
                    height={200}
                    centerText={String((stats && stats.total) || 0)}
                    centerSubtext="Tổng GV"
                  />
                  <div className="chart-legend">
                    {degreeData.map(function (item, idx) {
                      return (
                        <div key={idx} className="chart-legend-item">
                          <span className="chart-legend-dot" style={{ backgroundColor: item.color }} />
                          <span>{item.name}: {item.value}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>


        {/* Filters */}
        <div className="card" style={{ marginTop: "24px" }}>
          <div className="card-content">
            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
                  <div className="search-box">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Tìm kiếm giảng viên..."
                      value={searchInput}
                      onChange={function (e) { setSearchInput(e.target.value) }}
                    />
                  </div>
                  <button type="submit" className="btn btn-outline btn-sm">Tìm</button>
                </form>
                <select
                  className="filter-select"
                  value={departmentFilter}
                  onChange={handleDeptChange}
                >
                  <option value="all">Tất cả khoa</option>
                  {departments.map(function (d) {
                    return (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    )
                  })}
                </select>
                <select
                  className="filter-select"
                  value={degreeFilter}
                  onChange={function(e) {
                    var val = e.target.value;
                    setDegreeFilter(val);
                    updateParams({ degree: val === "all" ? undefined : val });
                  }}
                >
                  <option value="all">Tất cả học vị</option>
                  <option value="Cử nhân">Cử nhân</option>
                  <option value="Thạc sĩ">Thạc sĩ</option>
                  <option value="Tiến sĩ">Tiến sĩ</option>
                  <option value="GS/PGS">GS/PGS</option>
                </select>
              </div>
              <div className="admin-toolbar-right">
                <button className="btn btn-outline btn-sm" onClick={handleExport}>
                  <Download /> Xuất
                </button>
                <button className="btn btn-primary btn-sm" onClick={openCreate}>
                  <Plus /> Thêm giảng viên
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="chart-card" style={{ marginTop: "16px" }}>
          <div className="chart-card-header">
            <h3 className="chart-card-title">
              <GraduationCap /> Danh sách giảng viên
            </h3>
            <span className="badge badge-primary">
              {totalCount} giảng viên
            </span>
          </div>

          {error && (
            <div style={{ padding: "1rem 1.5rem", color: "#dc2626", fontSize: "0.875rem" }}>
              Lỗi: {error}
            </div>
          )}

          <div style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}><input type="checkbox" /></th>
                    <th>Giảng viên</th>
                    <th>Mã GV</th>
                    <th>Khoa</th>
                    <th>Học vị</th>
                    <th>Trạng thái</th>
                    <th style={{ width: "120px" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--muted-foreground)" }}>
                        Đang tải...
                      </td>
                    </tr>
                  ) : teacherList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--muted-foreground)" }}>
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    teacherList.map(function (teacher) {
                      var statusBadge = teacher.status === "Đang dạy"
                        ? "badge-success"
                        : teacher.status === "Nghỉ phép"
                        ? "badge-warning"
                        : "badge-secondary"

                      return (
                        <tr key={teacher.id}>
                          <td><input type="checkbox" /></td>
                          <td>
                            <div className="student-cell">
                              <div className="avatar avatar-sm">
                                {teacher.full_name
                                  ? teacher.full_name.split(" ").pop().charAt(0)
                                  : "?"}
                              </div>
                              <div>
                                <p className="student-name">{teacher.full_name}</p>
                                <p className="student-email">{teacher.email}</p>
                              </div>
                            </div>
                          </td>
                          <td><span className="text-code">{teacher.instructor_code}</span></td>
                          <td>{teacher.department_name || "—"}</td>
                          <td>{teacher.degree || "—"}</td>
                          <td>
                            <span className={"badge " + statusBadge}>
                              {teacher.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(teacher)}>
                                <Eye />
                              </button>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(teacher)}>
                                <Edit />
                              </button>
                              <button
                                className="btn btn-ghost btn-icon btn-sm text-danger"
                                onClick={function () { setConfirmDelete(teacher) }}
                              >
                                <Trash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                  Trang {currentPage} / {totalPages}
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn-outline btn-sm btn-icon"
                    onClick={function () { goToPage(currentPage - 1) }}
                    disabled={!pagination || !pagination.hasPrevPage}
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    className="btn btn-outline btn-sm btn-icon"
                    onClick={function () { goToPage(currentPage + 1) }}
                    disabled={!pagination || !pagination.hasNextPage}
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirm Delete */}
        {confirmDelete && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          }}>
            <div style={{
              background: "var(--card)", borderRadius: "0.75rem", padding: "2rem",
              maxWidth: "400px", width: "90%",
            }}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Xác nhận xóa</h3>
              <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
                Bạn có chắc muốn xóa giảng viên <strong>{confirmDelete.full_name}</strong>?
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-outline"
                  onClick={function () { setConfirmDelete(null) }}
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: "#dc2626" }}
                  onClick={function () { deleteInstructor(confirmDelete.id) }}
                  disabled={deleting}
                >
                  {deleting ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Error Popup */}
        {deleteErrorPopup && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110,
          }}>
            <div style={{
              background: "var(--card)", borderRadius: "0.75rem", padding: "2rem",
              maxWidth: "400px", width: "90%",
            }}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#dc2626" }}>Không thể xóa</h3>
              <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
                {deleteErrorPopup}
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-primary"
                  onClick={function () { setDeleteErrorPopup(null) }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Thêm/Sửa */}
        {showModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "var(--card)", padding: "2rem", borderRadius: "0.75rem", width: 600, maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>{editingId ? "Cập nhật giảng viên" : "Thêm giảng viên mới"}</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Mã GV *</label>
                    <input className="form-input" required value={formData.instructor_code} onChange={e => setFormData({...formData, instructor_code: e.target.value})} disabled={!!editingId} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Họ và tên *</label>
                    <input className="form-input" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
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
                    <select className="form-input" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})}>
                      <option value="">-- Chọn Khoa --</option>
                      {(departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Học vị</label>
                    <select className="form-input" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})}>
                      <option value="Cử nhân">Cử nhân</option>
                      <option value="Thạc sĩ">Thạc sĩ</option>
                      <option value="Tiến sĩ">Tiến sĩ</option>
                      <option value="GS/PGS">GS/PGS</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Trạng thái</label>
                    <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Đang dạy">Đang dạy</option>
                      <option value="Nghỉ phép">Nghỉ phép</option>
                      <option value="Đã nghỉ">Đã nghỉ</option>
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
      </div>
    </div>
  )
}
