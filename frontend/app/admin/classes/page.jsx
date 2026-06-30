
"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { SimpleBarChart, DonutChart } from "@/components/dashboard/charts"
import { useApi, usePaginatedApi, useMutation } from "@/hooks/use-api"
import { classService, adminMajorService, adminDepartmentService, instructorService, cohortService } from "@/lib/services/adminService"
import { exportToCSV } from "@/lib/utils/exportUtils"
import {
  ClipboardList, Search, Plus, Eye, Edit, Trash2, Download,
  Users, BookOpen, Calendar, TrendingUp, Award,
  Building, GraduationCap, ChevronLeft, ChevronRight
} from "lucide-react"

export default function ClassesPage() {
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [academicYearFilter, setAcademicYearFilter] = useState("all")
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleteErrorPopup, setDeleteErrorPopup] = useState(null)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    class_code: "", name: "", department_id: "", major_id: "", advisor_id: "", academic_year: "", status: "Đang học"
  })

  const { data: majors } = useApi(adminMajorService.getAll, [], { defaultData: [] })
  const { data: departments } = useApi(adminDepartmentService.getAll, [], { defaultData: [] })
  // For instructors dropdown, we might get paginated data, so we check if it's an array or object
  const { data: instructorsData } = useApi(instructorService.getAll, [{ limit: 100 }], { defaultData: [] })
  const instructors = Array.isArray(instructorsData) ? instructorsData : (instructorsData?.data || [])

  const { data: cohortsData } = useApi(cohortService.getAll, [{ limit: 100 }], { defaultData: [] })
  const cohorts = Array.isArray(cohortsData) ? cohortsData : (cohortsData?.data || [])

  const {
    data: classes,
    pagination,
    loading,
    error,
    updateParams,
    goToPage,
    refetch,
  } = usePaginatedApi(classService.getAll, { page: 1, limit: 12 })

  const { data: stats, loading: statsLoading } = useApi(
    classService.getStats, [], { defaultData: {} }
  )

  const { mutate: createClass, loading: creating } = useMutation(classService.create, {
    onSuccess: () => {
      setSuccessMsg("Thêm lớp học thành công")
      setShowModal(false)
      refetch()
      setTimeout(() => setSuccessMsg(""), 3000)
    },
    onError: (err) => { setErrorMsg(err.message); setTimeout(() => setErrorMsg(""), 3000) }
  })

  const { mutate: updateClass, loading: updating } = useMutation(classService.update, {
    onSuccess: () => {
      setSuccessMsg("Cập nhật lớp học thành công")
      setShowModal(false)
      refetch()
      setTimeout(() => setSuccessMsg(""), 3000)
    },
    onError: (err) => { setErrorMsg(err.message); setTimeout(() => setErrorMsg(""), 3000) }
  })

  const { mutate: deleteClass, loading: deleting } = useMutation(
    classService.delete,
    {
      onSuccess: function () {
        setSuccessMsg("Xóa lớp học thành công")
        setConfirmDelete(null)
        refetch()
        setTimeout(function () { setSuccessMsg("") }, 3000)
      },
      onError: function (err) {
        setDeleteErrorPopup(err.message || "Lỗi khi xóa lớp học")
        setConfirmDelete(null)
      },
    }
  )

  function handleSearch(e) {
    e.preventDefault()
    updateParams({ search: searchInput })
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData({
      class_code: "", name: "", department_id: "", major_id: "", advisor_id: "", academic_year: "", status: "Đang học"
    })
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditingId(c.id)
    setFormData({
      class_code: c.class_code, name: c.name, department_id: c.department_id || "", major_id: c.major_id || "", 
      advisor_id: c.advisor_id || "", academic_year: c.academic_year || "", status: c.status
    })
    setShowModal(true)
  }

  const handleExport = () => {
    if (classList.length === 0) return alert("Không có dữ liệu để xuất")
    const exportData = classList.map(c => ({
      "Mã lớp": c.class_code,
      "Tên lớp": c.name,
      "Ngành": c.major_name || "",
      "Khóa": c.academic_year || "",
      "Sĩ số": c.total_students || 0,
      "Trạng thái": c.status,
      "CVHT": c.advisor_name || ""
    }))
    exportToCSV(exportData, "Danh_sach_lop_hoc.csv")
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) updateClass(editingId, formData)
    else createClass(formData)
  }

  var classList = Array.isArray(classes) ? classes : []
  var totalCount = pagination ? pagination.totalItems : 0
  var currentPage = pagination ? pagination.currentPage : 1
  var totalPages = pagination ? pagination.totalPages : 1

  var topClasses = Array.isArray(stats && stats.topClasses)
    ? stats.topClasses
    : []

  var topClassesChart = topClasses.map(function (c) {
    return { name: c.class_code, gpa: parseFloat(c.avg_gpa) || 0 }
  })

  return (
    <div className="dashboard-content">
      <Header title="Quản lý lớp học" />

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
                <ClipboardList size={20} />
              </div>
            </div>
            <div className="summary-item-value">
              {statsLoading ? "..." : (stats && stats.total) || 0}
            </div>
            <div className="summary-item-label">Tổng số lớp</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon success">
                <Users size={20} />
              </div>
            </div>
            <div className="summary-item-value">
              {statsLoading ? "..." : (stats && stats.totalStudents) || 0}
            </div>
            <div className="summary-item-label">Tổng sinh viên</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon warning">
                <BookOpen size={20} />
              </div>
            </div>
            <div className="summary-item-value">
              {statsLoading ? "..." : (stats && stats.totalMajors) || 0}
            </div>
            <div className="summary-item-label">Ngành học</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon info">
                <Calendar size={20} />
              </div>
            </div>
            <div className="summary-item-value">
              {statsLoading ? "..." : (stats && stats.activeYears) || 0}
            </div>
            <div className="summary-item-label">Khóa đang học</div>
          </div>
        </div>

        {/* Charts */}
        <div className="data-grid-2" style={{ marginTop: "24px" }}>
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">
                <Award /> GPA trung bình - Top lớp
              </h3>
            </div>
            <div className="chart-card-body">
              {statsLoading ? (
                <div style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "2rem" }}>
                  Đang tải...
                </div>
              ) : topClassesChart.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "2rem" }}>
                  Chưa có dữ liệu
                </div>
              ) : (
                <SimpleBarChart
                  data={topClassesChart}
                  dataKey="gpa"
                  xKey="name"
                  color="#16a34a"
                  height={220}
                />
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
                      placeholder="Tìm kiếm lớp học..."
                      value={searchInput}
                      onChange={function (e) { setSearchInput(e.target.value) }}
                    />
                  </div>
                  <button type="submit" className="btn btn-outline btn-sm">
                    Tìm
                  </button>
                </form>
                <select
                  className="filter-select"
                  value={academicYearFilter}
                  onChange={function (e) {
                    setAcademicYearFilter(e.target.value)
                    updateParams({ academic_year: e.target.value === "all" ? undefined : e.target.value })
                  }}
                >
                  <option value="all">Tất cả khóa</option>
                  {cohorts.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={departmentFilter}
                  onChange={function (e) {
                    setDepartmentFilter(e.target.value)
                    updateParams({ department_id: e.target.value === "all" ? undefined : e.target.value })
                  }}
                >
                  <option value="all">Tất cả khoa</option>
                  {(departments || []).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={function (e) {
                    setStatusFilter(e.target.value)
                    updateParams({ status: e.target.value === "all" ? undefined : e.target.value })
                  }}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Đang học">Đang học</option>
                  <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
                </select>
              </div>
              <div className="admin-toolbar-right" style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-outline btn-sm" onClick={handleExport}>
                  <Download size={16} /> Xuất CSV
                </button>
                <button className="btn btn-primary btn-sm" onClick={openCreate}>
                  <Plus /> Thêm lớp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="chart-card" style={{ marginTop: "16px" }}>
          <div className="chart-card-header">
            <h3 className="chart-card-title">
              <ClipboardList /> Danh sách lớp học
            </h3>
            <span className="badge badge-primary">{totalCount} lớp</span>
          </div>
          <div className="chart-card-body" style={{ padding: "20px" }}>
            {error && (
              <div style={{ color: "#dc2626", marginBottom: "1rem" }}>
                Lỗi: {error}
              </div>
            )}
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)" }}>
                Đang tải...
              </div>
            ) : classList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)" }}>
                Không có dữ liệu
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "16px",
              }}>
                {classList.map(function (cls) {
                  var isActive = cls.status === "Đang học"
                  var gpa = parseFloat(cls.avg_gpa) || 0
                  var gpaLabel = gpa >= 3.5 ? "Xuất sắc"
                    : gpa >= 3.2 ? "Giỏi"
                    : gpa >= 2.5 ? "Khá"
                    : "Trung bình"
                  var gpaColor = gpa >= 3.5 ? "#16a34a"
                    : gpa >= 3.2 ? "#2563eb"
                    : "#f59e0b"
                  var gpaBg = gpa >= 3.5 ? "rgba(22,163,74,0.1)"
                    : gpa >= 3.2 ? "rgba(37,99,235,0.1)"
                    : "rgba(245,158,11,0.1)"

                  return (
                    <div
                      key={cls.id}
                      style={{
                        padding: "20px",
                        borderRadius: "12px",
                        border: isActive
                          ? "1px solid rgba(37,99,235,0.2)"
                          : "1px solid rgba(139,92,246,0.2)",
                        background: isActive
                          ? "linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(37,99,235,0.02) 100%)"
                          : "linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(139,92,246,0.02) 100%)",
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{
                          width: "48px", height: "48px", borderRadius: "12px",
                          background: isActive ? "rgba(37,99,235,0.1)" : "rgba(139,92,246,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <GraduationCap
                            size={24}
                            style={{ color: isActive ? "#2563eb" : "#8b5cf6" }}
                          />
                        </div>
                        <span className={"badge " + (isActive ? "badge-success" : "badge-info")}>
                          {cls.status}
                        </span>
                      </div>

                      {/* Info */}
                      <p style={{ fontSize: "12px", color: "var(--muted-foreground)", fontWeight: 600, marginBottom: "4px" }}>
                        {cls.class_code}
                      </p>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>
                        {cls.name}
                      </h3>
                      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "12px" }}>
                        {cls.major_name || "—"}
                      </p>

                      {/* Stats Grid */}
                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: "10px", padding: "12px", borderRadius: "8px",
                        background: "var(--accent)", marginBottom: "12px",
                      }}>
                        <div>
                          <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "2px" }}>
                            CVHT
                          </p>
                          <p style={{ fontSize: "12px", fontWeight: 600 }}>
                            {cls.advisor_name
                              ? cls.advisor_name.split(" ").slice(-2).join(" ")
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "2px" }}>
                            Khóa
                          </p>
                          <p style={{ fontSize: "12px", fontWeight: 600 }}>
                            {cls.academic_year || "—"}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "2px" }}>
                            Sĩ số
                          </p>
                          <p style={{ fontSize: "12px", fontWeight: 600 }}>
                            {cls.total_students || 0} SV
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "2px" }}>
                            GPA TB
                          </p>
                          <p style={{ fontSize: "12px", fontWeight: 700, color: gpaColor }}>
                            {gpa > 0 ? gpa.toFixed(2) : "—"}
                          </p>
                        </div>
                      </div>

                      {/* GPA Bar */}
                      {gpa > 0 && (
                        <div style={{ marginBottom: "14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                              Điểm trung bình lớp
                            </span>
                            <span style={{
                              fontSize: "11px", fontWeight: 700,
                              padding: "2px 8px", borderRadius: "4px",
                              background: gpaBg, color: gpaColor,
                            }}>
                              {gpaLabel}
                            </span>
                          </div>
                          <div style={{ height: "5px", borderRadius: "3px", background: "var(--accent)" }}>
                            <div style={{
                              width: ((gpa / 4) * 100) + "%",
                              height: "100%", borderRadius: "3px",
                              background: gpaColor,
                            }} />
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(cls)}>
                          <Eye size={14} /> Chi tiết
                        </button>
                        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(cls)}>
                          <Edit size={14} /> Sửa
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: "#dc2626" }}
                          onClick={function () { setConfirmDelete(cls) }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{
                marginTop: "20px", display: "flex",
                justifyContent: "center", gap: "0.5rem",
              }}>
                <button
                  className="btn btn-outline btn-sm btn-icon"
                  onClick={function () { goToPage(currentPage - 1) }}
                  disabled={!pagination || !pagination.hasPrevPage}
                >
                  <ChevronLeft />
                </button>
                <span style={{ padding: "0.375rem 0.75rem", fontSize: "0.875rem" }}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="btn btn-outline btn-sm btn-icon"
                  onClick={function () { goToPage(currentPage + 1) }}
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
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100,
          }}>
            <div style={{
              background: "var(--card)", borderRadius: "0.75rem",
              padding: "2rem", maxWidth: "400px", width: "90%",
            }}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                Xác nhận xóa
              </h3>
              <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
                Bạn có chắc muốn xóa lớp{" "}
                <strong>{confirmDelete.name}</strong> ({confirmDelete.class_code})?
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
                  onClick={function () { deleteClass(confirmDelete.id) }}
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
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>{editingId ? "Cập nhật lớp học" : "Thêm lớp học mới"}</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Mã lớp *</label>
                    <input className="form-input" required value={formData.class_code} onChange={e => setFormData({...formData, class_code: e.target.value})} disabled={!!editingId} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Tên lớp *</label>
                    <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Khóa (Năm học)</label>
                    <input 
                      className="form-input" 
                      list="class-cohorts-list"
                      placeholder="Chọn hoặc nhập Khóa (Vd: K24)"
                      value={formData.academic_year} 
                      onChange={e => setFormData({...formData, academic_year: e.target.value})}
                    />
                    <datalist id="class-cohorts-list">
                      {cohorts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </datalist>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Trạng thái</label>
                    <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Đang học">Đang học</option>
                      <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Khoa</label>
                    <select className="form-input" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})}>
                      <option value="">-- Chọn Khoa --</option>
                      {(departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Ngành học</label>
                    <select className="form-input" value={formData.major_id} onChange={e => setFormData({...formData, major_id: e.target.value})}>
                      <option value="">-- Chọn Ngành học --</option>
                      {(majors || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Cố vấn học tập</label>
                    <select className="form-input" value={formData.advisor_id} onChange={e => setFormData({...formData, advisor_id: e.target.value})}>
                      <option value="">-- Chọn Giảng viên --</option>
                      {instructors.map(i => <option key={i.id} value={i.id}>{i.full_name} ({i.instructor_code})</option>)}
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
