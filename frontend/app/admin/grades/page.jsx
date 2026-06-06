"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { DonutChart, SimpleAreaChart } from "@/components/dashboard/charts"
import { useApi, usePaginatedApi, useMutation } from "@/hooks/use-api"
import { GradeSummary } from "@/components/admin/grades/GradeSummary"
import { GradeDistribution } from "@/components/admin/grades/GradeDistribution"
import { adminGradeService, adminDepartmentService, cohortService, adminMajorService } from "@/lib/services/adminService"
import { exportToCSV } from "@/lib/utils/exportUtils"
import {
  FileText, Search, Download, Upload,
  Eye, Edit, CheckCircle, XCircle, Clock,
  TrendingUp, Award, Users, BookOpen, BarChart3, Plus, Trash2
} from "lucide-react"

export default function AdminGradesPage() {
  const [searchInput, setSearchInput] = useState("")
  const [semesterFilter, setSemesterFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [cohortFilter, setCohortFilter] = useState("all")
  const [majorFilter, setMajorFilter] = useState("all")
  const [classFilter, setClassFilter] = useState("all")
  const [letterGradeFilter, setLetterGradeFilter] = useState("all")
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    student_id: "", course_id: "", semester: "", attendance_score: "", midterm_score: "", final_score: ""
  })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [formDepartment, setFormDepartment] = useState("")
  const [formMajor, setFormMajor] = useState("")
  const [formClass, setFormClass] = useState("")
  const [formTerm, setFormTerm] = useState("")
  const [formYear, setFormYear] = useState("")
  const [viewingGrade, setViewingGrade] = useState(null)

  const [showImportModal, setShowImportModal] = useState(false)
  const [importDept, setImportDept] = useState("")
  const [importCohort, setImportCohort] = useState("")
  const [importMajor, setImportMajor] = useState("")
  const [importClass, setImportClass] = useState("")
  const [importYear, setImportYear] = useState("")
  const [importTerm, setImportTerm] = useState("")
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importErrors, setImportErrors] = useState([])
  const [importResult, setImportResult] = useState(null)


  const {
    data: grades,
    pagination,
    loading,
    error,
    updateParams,
    goToPage,
    refetch,
  } = usePaginatedApi(adminGradeService.getAll, { page: 1, limit: 15 })

  const { data: stats, loading: statsLoading } = useApi(
    adminGradeService.getStats, [], { defaultData: {} }
  )

  const { data: distribution, loading: distLoading } = useApi(
    adminGradeService.getDistribution, [], { defaultData: [] }
  )

  const { data: gpaTrends, loading: trendsLoading } = useApi(
    adminGradeService.getGPATrends, [], { defaultData: [] }
  )

  const { mutate: approveGrade, loading: approving } = useMutation(
    adminGradeService.approve,
    {
      onSuccess: function () {
        setSuccessMsg("Duyệt điểm thành công")
        refetch()
        setTimeout(function () { setSuccessMsg("") }, 3000)
      },
      onError: function (err) {
        setErrorMsg(err.message)
        setTimeout(function () { setErrorMsg("") }, 3000)
      },
    }
  )

  const { mutate: rejectGrade, loading: rejecting } = useMutation(
    adminGradeService.reject,
    {
      onSuccess: function () {
        setSuccessMsg("Đã từ chối điểm")
        refetch()
        setTimeout(function () { setSuccessMsg("") }, 3000)
      },
      onError: function (err) {
        setErrorMsg(err.message)
        setTimeout(function () { setErrorMsg("") }, 3000)
      },
    }
  )

  const { mutate: approveAllGrades, loading: approvingAll } = useMutation(
    adminGradeService.approveAll,
    {
      onSuccess: function (data) {
        var count = data && data.approvedCount ? data.approvedCount : 0
        setSuccessMsg("Đã duyệt " + count + " bảng điểm")
        refetch()
        setTimeout(function () { setSuccessMsg("") }, 3000)
      },
      onError: function (err) {
        setErrorMsg(err.message)
        setTimeout(function () { setErrorMsg("") }, 3000)
      },
    }
  )

  const { data: departments } = useApi(adminDepartmentService.getAll, [], { defaultData: [] })
  const { data: cohorts } = useApi(cohortService.getAll, [], { defaultData: [] })
  const { data: majors } = useApi(adminMajorService.getAll, [], { defaultData: [] })

  const { data: formOptions } = useApi(adminGradeService.getFormOptions, [], { defaultData: { students: [], courses: [] } })
  const students = formOptions?.students || []
  const courses = formOptions?.courses || []
  const classes = formOptions?.classes || []
  
  const filteredMajors = formDepartment ? (Array.isArray(majors) ? majors.filter(m => String(m.department_id) === String(formDepartment)) : []) : []
  const filteredClasses = formMajor ? classes.filter(c => String(c.major_id) === String(formMajor)) : []
  const filteredStudents = formClass ? students.filter(s => String(s.class_id) === String(formClass)) : []

  const { mutate: saveGrade, loading: saving } = useMutation(
    editingId ? function(data) { return adminGradeService.update(editingId, data) } : adminGradeService.create,
    {
      onSuccess: function () {
        setSuccessMsg(editingId ? "Cập nhật điểm thành công" : "Nhập điểm thành công")
        setShowModal(false)
        refetch()
        setTimeout(function () { setSuccessMsg("") }, 3000)
      },
      onError: function (err) {
        setErrorMsg(err.message)
        setTimeout(function () { setErrorMsg("") }, 3000)
      }
    }
  )

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminGradeService.delete(confirmDelete.id)
      setSuccessMsg("Xóa bảng điểm thành công")
      setConfirmDelete(null)
      refetch()
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi xóa")
    } finally {
      setDeleting(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData({ student_id: "", course_id: "", semester: "", attendance_score: "", midterm_score: "", final_score: "" })
    setFormDepartment("")
    setFormMajor("")
    setFormClass("")
    setFormTerm("")
    setFormYear("")
    setShowModal(true)
  }

  const openEdit = (g) => {
    const student = students.find(s => s.id === g.student_id)
    if (student) {
      setFormDepartment(student.department_id ? String(student.department_id) : "")
      setFormMajor(student.major_id ? String(student.major_id) : "")
      setFormClass(student.class_id ? String(student.class_id) : "")
    } else {
      setFormDepartment("")
      setFormMajor("")
      setFormClass("")
    }
    
    let term = "";
    let year = "";
    if (g.semester) {
      if (g.semester.includes("(")) {
        const match = g.semester.match(/HK(\d)\s*\((.*)\)/);
        if (match) { term = match[1]; year = match[2]; }
      } else {
        const match = g.semester.match(/HK(\d)-(.*)/);
        if (match) { term = match[1]; year = match[2]; }
      }
    }
    setFormTerm(term);
    setFormYear(year);

    setEditingId(g.id)
    setFormData({
      student_id: g.student_id,
      course_id: g.course_id,
      semester: g.semester,
      attendance_score: g.attendance_score != null ? g.attendance_score : "",
      midterm_score: g.midterm_score != null ? g.midterm_score : "",
      final_score: g.final_score != null ? g.final_score : ""
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      semester: formTerm && formYear ? `HK${formTerm} (${formYear})` : formData.semester,
      attendance_score: formData.attendance_score !== "" ? parseFloat(formData.attendance_score) : null,
      midterm_score: formData.midterm_score !== "" ? parseFloat(formData.midterm_score) : null,
      final_score: formData.final_score !== "" ? parseFloat(formData.final_score) : null
    }
    saveGrade(payload)
  }

  const handleImportSubmit = async (e) => {
    e.preventDefault()
    if (!importFile) return alert("Vui lòng chọn file Excel")
    if (!importYear || !importTerm) return alert("Vui lòng chọn năm học và học kỳ")

    const fd = new FormData()
    fd.append("file", importFile)
    if (importDept) fd.append("department_id", importDept)
    if (importCohort) fd.append("cohort_id", importCohort)
    if (importMajor) fd.append("major_id", importMajor)
    if (importClass) fd.append("class_id", importClass)
    fd.append("semester", `HK${importTerm} (${importYear})`)

    setImporting(true)
    setImportErrors([])
    setImportResult(null)
    try {
      const res = await adminGradeService.importGrades(fd)
      setImportResult(res.data)
      setImportErrors(res.data.errors || [])
      if (res.data.successCount > 0) {
        setSuccessMsg(`Import thành công ${res.data.successCount} bản ghi.`)
        refetch()
        setTimeout(() => setSuccessMsg(""), 4000)
      }
      if (res.data.errorCount === 0) {
        setShowImportModal(false)
        setImportFile(null)
      }
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi import file")
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const headers = "M\u00e3 Sinh vi\u00ean,M\u00e3 M\u00f4n h\u1ecdc,Chuy\u00ean c\u1ea7n,Gi\u1eefa k\u1ef3,Cu\u1ed1i k\u1ef3"
    const sampleRows = [
      "B22DCPT001,INT001,8.5,7.0,8.0",
      "B22DCPT002,INT001,9.0,8.5,9.0",
      "B22DCPT003,INT002,7.0,6.5,7.5",
    ]
    const csvContent = [headers, ...sampleRows].join("\n")
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "mau_nhap_diem.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleSearch(e) {
    e.preventDefault()
    updateParams({ search: searchInput })
  }

  const handleExport = () => {
    if (gradeList.length === 0) return alert("Không có dữ liệu để xuất")
    const exportData = gradeList.map(g => ({
      "Sinh viên": g.student_name,
      "Mã SV": g.student_code,
      "Môn học": g.course_name,
      "Mã Môn": g.course_code,
      "Học kỳ": g.semester,
      "Giữa kỳ": g.midterm_score != null ? g.midterm_score : "",
      "Cuối kỳ": g.final_score != null ? g.final_score : "",
      "Tổng kết": g.average_score != null ? parseFloat(g.average_score).toFixed(1) : "",
      "Xếp loại": g.letter_grade || "",
      "Trạng thái": g.status
    }))
    exportToCSV(exportData, "Danh_sach_diem.csv")
  }

  var gradeList = Array.isArray(grades) ? grades : []
  var totalCount = pagination ? pagination.totalItems : 0
  var currentPage = pagination ? pagination.currentPage : 1
  var totalPages = pagination ? pagination.totalPages : 1

  var approvalData = [
    { name: "Đã duyệt", value: (stats && stats.approved) || 0, color: "#16a34a" },
    { name: "Chờ duyệt", value: (stats && stats.pending) || 0, color: "#f59e0b" },
    { name: "Từ chối", value: (stats && stats.rejected) || 0, color: "#dc2626" },
  ]



  var distList = Array.isArray(distribution) ? distribution : []

  return (
    <div className="dashboard-content">
      <Header title="Quản lý điểm số" />

      <div className="dashboard-body">
        {successMsg && (
          <div style={{ padding: "0.75rem 1rem", background: "#dcfce7", border: "1px solid #16a34a", borderRadius: "0.5rem", color: "#166534", fontSize: "0.875rem" }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ padding: "0.75rem 1rem", background: "#fee2e2", border: "1px solid #dc2626", borderRadius: "0.5rem", color: "#991b1b", fontSize: "0.875rem" }}>
            {errorMsg}
          </div>
        )}

        {/* Summary Stats */}
        <GradeSummary statsLoading={statsLoading} stats={stats} />

        {/* Grade Distribution */}
        <GradeDistribution distList={distList} />

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
                      placeholder="Tìm sinh viên..."
                      value={searchInput}
                      onChange={function (e) { setSearchInput(e.target.value) }}
                    />
                  </div>
                  <button type="submit" className="btn btn-outline btn-sm">Tìm</button>
                </form>
                                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={function (e) {
                    setStatusFilter(e.target.value)
                    updateParams({ status: e.target.value === "all" ? undefined : e.target.value })
                  }}
                >
                  <option value="all">Trạng thái</option>
                  <option value="Đã duyệt">Đã duyệt</option>
                  <option value="Chờ duyệt">Chờ duyệt</option>
                  <option value="Từ chối">Từ chối</option>
                </select>
                <select
                  className="filter-select"
                  value={departmentFilter}
                  onChange={function (e) {
                    setDepartmentFilter(e.target.value)
                    setMajorFilter("all")
                    updateParams({ 
                      department_id: e.target.value === "all" ? undefined : e.target.value,
                      major_id: undefined
                    })
                  }}
                >
                  <option value="all">Khoa</option>
                  {(departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select
                  className="filter-select"
                  value={cohortFilter}
                  onChange={function (e) {
                    setCohortFilter(e.target.value)
                    updateParams({ cohort_id: e.target.value === "all" ? undefined : e.target.value })
                  }}
                >
                  <option value="all">Khóa</option>
                  {(cohorts || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                  className="filter-select"
                  value={majorFilter}
                  onChange={function (e) {
                    setMajorFilter(e.target.value)
                    setClassFilter("all")
                    updateParams({ 
                      major_id: e.target.value === "all" ? undefined : e.target.value,
                      class_id: undefined
                    })
                  }}
                >
                  <option value="all">Ngành</option>
                  {(departmentFilter !== "all" ? (majors || []).filter(m => String(m.department_id) === String(departmentFilter)) : (majors || [])).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <select
                  className="filter-select"
                  value={classFilter}
                  onChange={function (e) {
                    setClassFilter(e.target.value)
                    updateParams({ class_id: e.target.value === "all" ? undefined : e.target.value })
                  }}
                >
                  <option value="all">Lớp</option>
                  {(majorFilter !== "all" ? classes.filter(c => String(c.major_id) === String(majorFilter)) : classes).map(c => <option key={c.id} value={c.id}>{c.class_code}</option>)}
                </select>
                <select
                  className="filter-select"
                  value={letterGradeFilter}
                  onChange={function (e) {
                    setLetterGradeFilter(e.target.value)
                    updateParams({ letter_grade: e.target.value === "all" ? undefined : e.target.value })
                  }}
                >
                  <option value="all">Điểm</option>
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C+">C+</option>
                  <option value="C">C</option>
                  <option value="D+">D+</option>
                  <option value="D">D</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div className="admin-toolbar-right" style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus /> Nhập điểm</button>
                <button className="btn btn-outline btn-sm" onClick={() => setShowImportModal(true)}><Download /> Import</button>
                <button className="btn btn-outline btn-sm" onClick={handleExport}><Upload /> Export</button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={function () {
                    approveAllGrades({ semester: semesterFilter || undefined })
                  }}
                  disabled={approvingAll}
                >
                  <CheckCircle />
                  {approvingAll ? "Đang duyệt..." : "Duyệt tất cả"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="chart-card" style={{ marginTop: "16px" }}>
          <div className="chart-card-header">
            <h3 className="chart-card-title"><FileText /> Bảng điểm</h3>
            <span className="badge badge-primary">{totalCount} bản ghi</span>
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
                    <th>Sinh viên</th>
                    <th>Môn học</th>
                    <th>Giảng viên</th>
                    <th>Học kỳ</th>
                    <th className="text-center">Giữa kỳ</th>
                    <th className="text-center">Cuối kỳ</th>
                    <th className="text-center">Tổng kết</th>
                    <th className="text-center">Xếp loại</th>
                    <th>Trạng thái</th>
                    <th style={{ width: "140px" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: "2rem", color: "var(--muted-foreground)" }}>
                        Đang tải...
                      </td>
                    </tr>
                  ) : gradeList.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: "2rem", color: "var(--muted-foreground)" }}>
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    gradeList.map(function (grade) {
                      var avg = grade.average_score ? parseFloat(grade.average_score) : null
                      var avgColor = avg === null ? "var(--foreground)"
                        : avg >= 8 ? "#16a34a"
                        : avg >= 6.5 ? "#2563eb"
                        : avg >= 5 ? "#f59e0b"
                        : "#dc2626"

                      var letterGrade = grade.letter_grade || ""
                      var letterBg = letterGrade.startsWith("A") ? "rgba(22,163,74,0.1)"
                        : letterGrade.startsWith("B") ? "rgba(37,99,235,0.1)"
                        : letterGrade.startsWith("C") ? "rgba(245,158,11,0.1)"
                        : "rgba(220,38,38,0.1)"
                      var letterColor = letterGrade.startsWith("A") ? "#16a34a"
                        : letterGrade.startsWith("B") ? "#2563eb"
                        : letterGrade.startsWith("C") ? "#f59e0b"
                        : "#dc2626"

                      var statusBadge = grade.status === "Đã duyệt" ? "badge-success"
                        : grade.status === "Chờ duyệt" ? "badge-warning"
                        : "badge-danger"

                      return (
                        <tr key={grade.id}>
                          <td><input type="checkbox" /></td>
                          <td>
                            <div className="student-cell">
                              <div className="avatar avatar-sm">
                                {grade.student_name
                                  ? grade.student_name.split(" ").pop().charAt(0)
                                  : "?"}
                              </div>
                              <div>
                                <p className="student-name">{grade.student_name}</p>
                                <p className="student-email">{grade.student_code}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p style={{ fontWeight: 500 }}>{grade.course_name}</p>
                            <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                              {grade.course_code}
                            </p>
                          </td>
                          <td>
                            <div className="student-cell" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div className="avatar avatar-sm" style={{ width: "24px", height: "24px", fontSize: "10px", background: "var(--primary-light)", color: "var(--primary)" }}>
                                {grade.instructor_name ? grade.instructor_name.split(" ").pop().charAt(0) : "?"}
                              </div>
                              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{grade.instructor_name || "-"}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: "13px" }}>{grade.semester}</td>
                          <td className="text-center">
                            {grade.midterm_score != null ? grade.midterm_score : "—"}
                          </td>
                          <td className="text-center">
                            {grade.final_score != null ? grade.final_score : "—"}
                          </td>
                          <td className="text-center">
                            <span style={{ fontSize: "16px", fontWeight: 700, color: avgColor }}>
                              {avg != null ? avg.toFixed(1) : "—"}
                            </span>
                          </td>
                          <td className="text-center">
                            {letterGrade ? (
                              <span style={{
                                display: "inline-block", padding: "4px 10px", borderRadius: "20px",
                                fontSize: "13px", fontWeight: 700,
                                background: letterBg, color: letterColor,
                              }}>
                                {letterGrade}
                              </span>
                            ) : "—"}
                          </td>
                          <td>
                            <span className={"badge " + statusBadge}>{grade.status}</span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setViewingGrade(grade)} title="Xem chi tiết"><Eye /></button>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={function() { openEdit(grade) }} title="Sửa"><Edit /></button>
                              <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={function() { setConfirmDelete(grade) }} title="Xóa"><Trash2 /></button>
                              {grade.status === "Chờ duyệt" && (
                                <>
                                  <button
                                    className="btn btn-ghost btn-icon btn-sm text-success"
                                    onClick={function () { approveGrade(grade.id) }}
                                    disabled={approving}
                                    title="Duyệt"
                                  >
                                    <CheckCircle />
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-icon btn-sm text-danger"
                                    onClick={function () { rejectGrade(grade.id) }}
                                    disabled={rejecting}
                                    title="Từ chối"
                                  >
                                    <XCircle />
                                  </button>
                                </>
                              )}
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
              <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                  Trang {currentPage} / {totalPages} — {totalCount} bản ghi
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={function () { goToPage(currentPage - 1) }}
                    disabled={!pagination || !pagination.hasPrevPage}
                  >
                    Trước
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={function () { goToPage(currentPage + 1) }}
                    disabled={!pagination || !pagination.hasNextPage}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showImportModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "var(--card)", padding: "2rem", borderRadius: "0.75rem", width: 600, maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Import điểm từ file Excel</h3>
              <form onSubmit={handleImportSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Khoa</label>
                    <select className="form-input" value={importDept} onChange={e => {
                      setImportDept(e.target.value)
                      setImportMajor("")
                      setImportClass("")
                    }}>
                      <option value="">-- Chọn khoa --</option>
                      {(departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Khóa học</label>
                    <select className="form-input" value={importCohort} onChange={e => setImportCohort(e.target.value)}>
                      <option value="">-- Chọn khóa --</option>
                      {(cohorts || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Ngành</label>
                    <select className="form-input" value={importMajor} onChange={e => {
                      setImportMajor(e.target.value)
                      setImportClass("")
                    }}>
                      <option value="">-- Chọn ngành --</option>
                      {(importDept ? (majors || []).filter(m => String(m.department_id) === String(importDept)) : (majors || [])).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Lớp</label>
                    <select className="form-input" value={importClass} onChange={e => setImportClass(e.target.value)}>
                      <option value="">-- Chọn lớp --</option>
                      {(importMajor ? classes.filter(c => String(c.major_id) === String(importMajor)) : classes).map(c => <option key={c.id} value={c.id}>{c.class_code}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Học kỳ *</label>
                    <select className="form-input" required value={importTerm} onChange={e => setImportTerm(e.target.value)}>
                      <option value="">-- Chọn --</option>
                      <option value="1">Học kỳ 1</option>
                      <option value="2">Học kỳ 2</option>
                      <option value="3">Học kỳ 3</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Năm học *</label>
                    <select className="form-input" required value={importYear} onChange={e => setImportYear(e.target.value)}>
                      <option value="">-- Chọn --</option>
                      <option value="2022-2023">2022-2023</option>
                      <option value="2023-2024">2023-2024</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>File Excel *</label>
                    <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8 }}>
                      C\u1ed9t: <strong>M\u00e3 Sinh vi\u00ean</strong> | <strong>M\u00e3 M\u00f4n h\u1ecdc</strong> | <strong>Chuy\u00ean c\u1ea7n</strong> | <strong>Gi\u1eefa k\u1ef3</strong> | <strong>Cu\u1ed1i k\u1ef3</strong>
                      {" "}(<button type="button" style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12, textDecoration: "underline" }} onClick={handleDownloadTemplate}>T\u1ea3i file m\u1eabu</button>)
                    </p>
                    <input type="file" accept=".xlsx, .xls, .csv" required className="form-input" onChange={e => setImportFile(e.target.files[0])} />
                  </div>

                  {importResult && (
                    <div style={{ gridColumn: "1 / -1", padding: "0.75rem", borderRadius: "0.5rem", background: importResult.errorCount > 0 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${importResult.errorCount > 0 ? "#fca5a5" : "#86efac"}` }}>
                      <p style={{ fontWeight: 600, marginBottom: 4, color: importResult.errorCount > 0 ? "#dc2626" : "#16a34a" }}>
                        \u2714 Th\u00e0nh c\u00f4ng: {importResult.successCount} | \u2716 L\u1ed7i: {importResult.errorCount}
                      </p>
                      {importErrors.length > 0 && (
                        <ul style={{ fontSize: 12, color: "#dc2626", margin: 0, paddingLeft: 16 }}>
                          {importErrors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                          {importErrors.length > 5 && <li>...v\u00e0 {importErrors.length - 5} l\u1ed7i kh\u00e1c</li>}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowImportModal(false)} disabled={importing}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={importing}>
                    {importing ? "Đang xử lý..." : "Import"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewingGrade && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "var(--card)", borderRadius: "0.75rem", padding: "2rem", maxWidth: "500px", width: "90%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Chi tiết bảng điểm</h3>
                <button className="btn btn-ghost btn-icon" onClick={() => setViewingGrade(null)}><XCircle /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div><span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Sinh viên</span><p style={{ fontWeight: 600 }}>{viewingGrade.student_name} ({viewingGrade.student_code})</p></div>
                <div><span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Môn học</span><p style={{ fontWeight: 600 }}>{viewingGrade.course_name} ({viewingGrade.course_code})</p></div>
                <div><span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Học kỳ</span><p style={{ fontWeight: 600 }}>{viewingGrade.semester}</p></div>
                <div><span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Trạng thái</span><p style={{ fontWeight: 600 }}>{viewingGrade.status}</p></div>
                <div style={{ gridColumn: "1 / -1", height: "1px", background: "var(--border)", margin: "0.5rem 0" }}></div>
                <div><span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Điểm chuyên cần</span><p style={{ fontWeight: 600 }}>{viewingGrade.attendance_score ?? "—"}</p></div>
                <div><span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Điểm giữa kỳ</span><p style={{ fontWeight: 600 }}>{viewingGrade.midterm_score ?? "—"}</p></div>
                <div><span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Điểm cuối kỳ</span><p style={{ fontWeight: 600 }}>{viewingGrade.final_score ?? "—"}</p></div>
                <div><span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Tổng kết (Hệ 10)</span><p style={{ fontWeight: 600, color: "var(--primary)" }}>{viewingGrade.average_score ?? "—"}</p></div>
                <div><span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Xếp loại</span><p style={{ fontWeight: 600 }}>{viewingGrade.letter_grade ?? "—"}</p></div>
                <div><span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Điểm hệ 4</span><p style={{ fontWeight: 600 }}>{viewingGrade.gpa_score ?? "—"}</p></div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-outline" onClick={() => setViewingGrade(null)}>Đóng</button>
              </div>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "var(--card)", borderRadius: "0.75rem", padding: "2rem", maxWidth: "400px", width: "90%" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Xác nhận xóa</h3>
              <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>Bạn có chắc muốn xóa bảng điểm này?</p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button className="btn btn-outline" onClick={() => setConfirmDelete(null)} disabled={deleting}>Hủy</button>
                <button className="btn btn-primary" style={{ background: "#dc2626" }} onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "var(--card)", padding: "2rem", borderRadius: "0.75rem", width: 600, maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>{editingId ? "Cập nhật điểm" : "Nhập điểm mới"}</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {/* CASCADING DROPDOWNS */}
                  <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Khoa</label>
                      <select className="form-input" value={formDepartment} onChange={e => {
                        setFormDepartment(e.target.value)
                        setFormMajor("")
                        setFormClass("")
                        setFormData({...formData, student_id: ""})
                      }}>
                        <option value="">-- Chọn khoa --</option>
                        {Array.isArray(departments) && departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Ngành</label>
                      <select className="form-input" value={formMajor} onChange={e => {
                        setFormMajor(e.target.value)
                        setFormClass("")
                        setFormData({...formData, student_id: ""})
                      }} disabled={!formDepartment}>
                        <option value="">-- Chọn ngành --</option>
                        {filteredMajors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Lớp</label>
                      <select className="form-input" value={formClass} onChange={e => {
                        setFormClass(e.target.value)
                        setFormData({...formData, student_id: ""})
                      }} disabled={!formMajor}>
                        <option value="">-- Chọn lớp --</option>
                        {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.class_code}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Sinh viên *</label>
                    <select className="form-input" required value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} disabled={!formClass}>
                      <option value="">-- Chọn sinh viên --</option>
                      {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.student_code} - {s.full_name}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Môn học *</label>
                    <select className="form-input" required value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})}>
                      <option value="">-- Chọn môn học --</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Học kỳ *</label>
                    <select className="form-input" required value={formTerm} onChange={e => setFormTerm(e.target.value)}>
                      <option value="">-- Chọn --</option>
                      <option value="1">Học kỳ 1</option>
                      <option value="2">Học kỳ 2</option>
                      <option value="3">Học kỳ 3</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Năm học *</label>
                    <select className="form-input" required value={formYear} onChange={e => setFormYear(e.target.value)}>
                      <option value="">-- Chọn --</option>
                      <option value="2022-2023">2022-2023</option>
                      <option value="2023-2024">2023-2024</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Chuyên cần</label>
                    <input type="number" step="0.1" min="0" max="10" className="form-input" value={formData.attendance_score} onChange={e => setFormData({...formData, attendance_score: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Giữa kỳ</label>
                    <input type="number" step="0.1" min="0" max="10" className="form-input" value={formData.midterm_score} onChange={e => setFormData({...formData, midterm_score: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Cuối kỳ</label>
                    <input type="number" step="0.1" min="0" max="10" className="form-input" value={formData.final_score} onChange={e => setFormData({...formData, final_score: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={saving}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Đang lưu..." : "Lưu điểm"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
