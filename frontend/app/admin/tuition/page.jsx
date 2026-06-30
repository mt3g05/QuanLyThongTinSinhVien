"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { useApi, usePaginatedApi, useMutation } from "@/hooks/use-api"
import { adminTuitionService, cohortService, settingService, adminStudentService } from "@/lib/services/adminService"
import {
  CreditCard, Search, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertTriangle, FileText, Check, Eye, Printer, Plus, Trash2
} from "lucide-react"

export default function AdminTuitionPage() {
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [cohortFilter, setCohortFilter] = useState("all")
  const [viewingInvoice, setViewingInvoice] = useState(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    studentCodeSearch: "",
    selectedStudent: null,
    totalCredits: "",
  })
  const [searchStudentResults, setSearchStudentResults] = useState([])
  const [searchingStudent, setSearchingStudent] = useState(false)
  
  const { data: settings } = useApi(settingService.getAll, [], { defaultData: {} })

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-print-area");
    if (!printContent) return;
    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    windowPrint.document.write(`
      <html>
        <head>
          <title>In hóa đơn - ${viewingInvoice?.student_code}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h2 { margin: 0; font-size: 24px; text-transform: uppercase; color: #111; }
            .header p { margin: 5px 0; color: #555; font-size: 14px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
            .info-item { font-size: 14px; }
            .info-item strong { display: inline-block; width: 120px; color: #444; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th, .table td { border: 1px solid #ccc; padding: 12px; text-align: left; }
            .table th { background-color: #f8f9fa; font-weight: 600; }
            .total-row td { font-weight: bold; font-size: 16px; background-color: #f1f5f9; }
            .footer { display: flex; justify-content: space-between; margin-top: 50px; }
            .signature { text-align: center; width: 250px; }
            .signature-title { font-weight: bold; margin-bottom: 80px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  }

  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const {
    data: tuitions,
    pagination,
    loading,
    error,
    updateParams,
    goToPage,
    refetch,
  } = usePaginatedApi(adminTuitionService.getAll, { page: 1, limit: 10 })

  const { data: cohorts } = useApi(cohortService.getAll, [], { defaultData: [] })

  const { data: stats, loading: statsLoading } = useApi(
    adminTuitionService.getStats,
    [],
    { defaultData: {} }
  )

  const { mutate: updateStatus, loading: updating } = useMutation(
    adminTuitionService.updateStatus,
    {
      onSuccess: function () {
        setSuccessMsg("Cập nhật trạng thái thành công")
        refetch()
        setTimeout(function () { setSuccessMsg("") }, 3000)
      },
      onError: function (err) {
        setErrorMsg(err.message || "Lỗi cập nhật trạng thái")
        setTimeout(function () { setErrorMsg("") }, 3000)
      },
    }
  )

  const { mutate: createTuition, loading: creatingTuition } = useMutation(
    adminTuitionService.create,
    {
      onSuccess: function () {
        setSuccessMsg("Tạo hóa đơn thành công")
        setShowCreateModal(false)
        setCreateForm({ studentCodeSearch: "", selectedStudent: null, totalCredits: "" })
        refetch()
        setTimeout(function () { setSuccessMsg("") }, 3000)
      },
      onError: function (err) {
        setErrorMsg(err.message || "Lỗi tạo hóa đơn")
        setTimeout(function () { setErrorMsg("") }, 3000)
      },
    }
  )

  const { mutate: deleteTuition, loading: deletingTuition } = useMutation(
    adminTuitionService.delete,
    {
      onSuccess: function () {
        setSuccessMsg("Xóa hóa đơn thành công")
        refetch()
        setTimeout(function () { setSuccessMsg("") }, 3000)
      },
      onError: function (err) {
        setErrorMsg(err.message || "Lỗi xóa hóa đơn")
        setTimeout(function () { setErrorMsg("") }, 3000)
      },
    }
  )

  const handleDeleteTuition = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa hóa đơn học phí này?")) {
      deleteTuition(id)
    }
  }

  const handleSearchStudent = async () => {
    if (!createForm.studentCodeSearch.trim()) return;
    setSearchingStudent(true)
    try {
      const res = await adminStudentService.getAll({ search: createForm.studentCodeSearch.trim(), limit: 5 })
      setSearchStudentResults(res.data || [])
    } catch (e) {
      setErrorMsg("Lỗi tìm kiếm sinh viên")
    } finally {
      setSearchingStudent(false)
    }
  }

  const handleSelectStudent = async (student) => {
    setCreateForm({...createForm, selectedStudent: student, totalCredits: "Đang tải..."})
    try {
      const currentSemester = settings?.current_semester || "HK1"
      const res = await adminTuitionService.getRegisteredCredits(student.id, { semester: currentSemester })
      setCreateForm(prev => ({
        ...prev, 
        selectedStudent: student, 
        totalCredits: res.data?.total_credits?.toString() || "0"
      }))
    } catch (e) {
      console.error("Lỗi lấy tín chỉ:", e)
      setCreateForm(prev => ({
        ...prev, 
        selectedStudent: student, 
        totalCredits: "0"
      }))
    }
  }

  const handleCreateTuition = (e) => {
    e.preventDefault()
    if (!createForm.selectedStudent) {
      setErrorMsg("Vui lòng chọn sinh viên")
      return
    }
    if (!createForm.totalCredits) {
      setErrorMsg("Vui lòng nhập số tín chỉ")
      return
    }
    const currentSemester = settings?.current_semester || "HK1"
    const creditPrice = settings?.credit_price || 0
    createTuition({
      student_id: createForm.selectedStudent.id,
      semester: currentSemester,
      total_credits: createForm.totalCredits,
      credit_fee: creditPrice
    })
  }

  function handleSearch(e) {
    e.preventDefault()
    updateParams({ search: searchInput })
  }

  function handleUpdateStatus(id, newStatus) {
    updateStatus(id, { status: newStatus })
  }

  function formatCurrency(amount) {
    if (!amount) return "0 ₫"
    return parseInt(amount).toLocaleString('vi-VN') + " ₫"
  }

  var tuitionList = Array.isArray(tuitions) ? tuitions : []
  var totalCount = pagination ? pagination.totalItems : 0
  var currentPage = pagination ? pagination.currentPage : 1
  var totalPages = pagination ? pagination.totalPages : 1

  return (
    <div className="dashboard-content">
      <Header title="Quản lý học phí" />

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

        {/* Summary Stats */}
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon primary"><FileText size={20} /></div>
            </div>
            <div className="summary-item-value">{statsLoading ? "..." : (stats?.total_records || 0)}</div>
            <div className="summary-item-label">Tổng số hóa đơn</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon info"><CreditCard size={20} /></div>
            </div>
            <div className="summary-item-value">{statsLoading ? "..." : formatCurrency(stats?.expected_amount)}</div>
            <div className="summary-item-label">Tổng phải thu</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-header">
              <div className="summary-item-icon success"><CheckCircle size={20} /></div>
            </div>
            <div className="summary-item-value">{statsLoading ? "..." : formatCurrency(stats?.collected_amount)}</div>
            <div className="summary-item-label">Đã thu</div>
          </div>

        </div>

        {/* Filters */}
        <div className="card" style={{ marginTop: "24px" }}>
          <div className="card-content">
            <div className="admin-toolbar">
              <div className="admin-toolbar-left" style={{ flexWrap: "wrap" }}>
                <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
                  <div className="search-box">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Tìm mã, tên SV..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-outline btn-sm">Tìm</button>
                </form>
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    updateParams({ status: e.target.value })
                  }}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Đã thanh toán">Đã thanh toán</option>
                  <option value="Chưa thanh toán">Chưa thanh toán</option>
                  <option value="Chờ xác nhận">Chờ xác nhận</option>
                </select>
                <select
                  className="filter-select"
                  value={cohortFilter}
                  onChange={(e) => {
                    setCohortFilter(e.target.value)
                    updateParams({ cohort_id: e.target.value === "all" ? undefined : e.target.value })
                  }}
                >
                  <option value="all">Tất cả khóa</option>
                  {(cohorts || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                  className="filter-select"
                  value={semesterFilter}
                  onChange={(e) => {
                    setSemesterFilter(e.target.value)
                    updateParams({ semester: e.target.value })
                  }}
                >
                  <option value="all">Tất cả học kỳ</option>
                  <option value="HK1_2023_2024">HK1 2023-2024</option>
                  <option value="HK2_2023_2024">HK2 2023-2024</option>
                </select>
              </div>
              <div className="admin-toolbar-right">
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
                  <Plus size={16} style={{ marginRight: 4 }}/> Tạo hóa đơn
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tuitions List */}
        <div className="card" style={{ marginTop: "16px" }}>
          <div className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <CreditCard size={18} /> Danh sách hóa đơn học phí
            </h3>
            <span className="badge badge-primary">{totalCount} bản ghi</span>
          </div>
          
          <div className="card-body">
            {error ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#dc2626" }}>Lỗi: {error}</div>
            ) : loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>Đang tải...</div>
            ) : tuitionList.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>Không có dữ liệu</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "var(--accent)", color: "var(--muted-foreground)", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Sinh viên</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Lớp</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Học kỳ</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tổng tiền</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Trạng thái</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tuitionList.map(t => (
                      <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 600 }}>{t.full_name}</div>
                          <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{t.student_code}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{t.class_name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{t.semester}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{formatCurrency(t.total_amount)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className={`badge ${t.status === 'Đã thanh toán' ? 'badge-success' : 'badge-warning'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => setViewingInvoice(t)}
                            title="Xem/In hóa đơn"
                          >
                            <Eye size={14} style={{ marginRight: 4 }} /> Xem & In
                          </button>
                          {t.status !== 'Đã thanh toán' && (
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleUpdateStatus(t.id, 'Đã thanh toán')}
                              disabled={updating}
                            >
                              <Check size={14} style={{ marginRight: 4 }}/> {t.status === 'Chờ xác nhận' ? 'Xác nhận đã thu' : 'Thu tiền'}
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ color: 'var(--destructive)', borderColor: 'var(--destructive)' }}
                            onClick={() => handleDeleteTuition(t.id)}
                            disabled={deletingTuition}
                            title="Xóa hóa đơn"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "0.5rem", paddingBottom: "20px" }}>
                <button className="btn btn-outline btn-sm btn-icon" onClick={() => goToPage(currentPage - 1)} disabled={!pagination?.hasPrevPage}><ChevronLeft /></button>
                <span style={{ padding: "0.375rem 0.75rem", fontSize: "0.875rem" }}>{currentPage} / {totalPages}</span>
                <button className="btn btn-outline btn-sm btn-icon" onClick={() => goToPage(currentPage + 1)} disabled={!pagination?.hasNextPage}><ChevronRight /></button>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Modal */}
        {viewingInvoice && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "var(--card)", padding: "1.5rem", borderRadius: "0.75rem", width: 800, maxHeight: "95vh", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontWeight: 700, margin: 0, fontSize: "18px" }}>Chi tiết hóa đơn học phí</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} style={{ marginRight: 6 }}/> In hóa đơn</button>
                  <button className="btn btn-outline" onClick={() => setViewingInvoice(null)}>Đóng</button>
                </div>
              </div>
              
              <div id="invoice-print-area" style={{ overflowY: "auto", padding: "30px", border: "1px solid var(--border)", borderRadius: "8px", background: "#fff", color: "#000", flex: 1 }}>
                <div className="header" style={{ textAlign: "center", marginBottom: "30px" }}>
                  <h2 style={{ margin: 0, fontSize: "24px", textTransform: "uppercase", fontWeight: 700 }}>Biên lai thu học phí</h2>
                  <p style={{ margin: "8px 0", color: "#555", fontSize: "14px" }}>Học kỳ: {viewingInvoice.semester}</p>
                </div>
                
                <div className="info-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "30px" }}>
                  <div className="info-item" style={{ fontSize: "14px" }}><strong style={{ display: "inline-block", width: "120px" }}>Họ và tên:</strong> {viewingInvoice.full_name}</div>
                  <div className="info-item" style={{ fontSize: "14px" }}><strong style={{ display: "inline-block", width: "120px" }}>Mã sinh viên:</strong> {viewingInvoice.student_code}</div>
                  <div className="info-item" style={{ fontSize: "14px" }}><strong style={{ display: "inline-block", width: "120px" }}>Lớp:</strong> {viewingInvoice.class_name || "—"}</div>
                  <div className="info-item" style={{ fontSize: "14px" }}><strong style={{ display: "inline-block", width: "120px" }}>Trạng thái:</strong> <span style={{ color: viewingInvoice.status === 'Đã thanh toán' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{viewingInvoice.status}</span></div>
                </div>

                <table className="table" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
                  <thead>
                    <tr>
                      <th style={{ border: "1px solid #ccc", padding: "12px", textAlign: "left", backgroundColor: "#f8f9fa" }}>Nội dung thu</th>
                      <th style={{ border: "1px solid #ccc", padding: "12px", textAlign: "right", backgroundColor: "#f8f9fa", width: "200px" }}>Số tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid #ccc", padding: "12px", textAlign: "left" }}>Học phí học kỳ {viewingInvoice.semester}</td>
                      <td style={{ border: "1px solid #ccc", padding: "12px", textAlign: "right" }}>{formatCurrency(viewingInvoice.total_amount)}</td>
                    </tr>
                    {viewingInvoice.discount > 0 && (
                      <tr>
                        <td style={{ border: "1px solid #ccc", padding: "12px", textAlign: "left" }}>Giảm trừ / Miễn giảm</td>
                        <td style={{ border: "1px solid #ccc", padding: "12px", textAlign: "right" }}>- {formatCurrency(viewingInvoice.discount)}</td>
                      </tr>
                    )}
                    <tr className="total-row" style={{ fontWeight: "bold", fontSize: "16px", backgroundColor: "#f1f5f9" }}>
                      <td style={{ border: "1px solid #ccc", padding: "12px", textAlign: "left" }}>Tổng số tiền cần thanh toán</td>
                      <td style={{ border: "1px solid #ccc", padding: "12px", textAlign: "right", color: "#0f172a" }}>{formatCurrency(viewingInvoice.total_amount - (viewingInvoice.discount || 0))}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "50px" }}>
                  <div className="signature" style={{ textAlign: "center", width: "250px" }}>
                    <p style={{ margin: "0 0 80px 0", fontWeight: "bold" }}>Người nộp tiền</p>
                    <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>(Ký, ghi rõ họ tên)</p>
                  </div>
                  <div className="signature" style={{ textAlign: "center", width: "250px" }}>
                    <p style={{ margin: "0 0 5px 0", fontStyle: "italic", fontSize: "14px" }}>Ngày ..... tháng ..... năm 20...</p>
                    <p style={{ margin: "0 0 80px 0", fontWeight: "bold" }}>Người thu tiền</p>
                    <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>(Ký, đóng dấu)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "var(--card)", padding: "1.5rem", borderRadius: "0.75rem", width: 600, maxHeight: "95vh", overflowY: "auto" }}>
              <h3 style={{ fontWeight: 700, margin: "0 0 1.5rem 0", fontSize: "18px" }}>Tạo hóa đơn học phí</h3>
              <form onSubmit={handleCreateTuition}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>Tìm sinh viên</label>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Nhập mã sinh viên hoặc tên..." 
                      value={createForm.studentCodeSearch}
                      onChange={e => setCreateForm({...createForm, studentCodeSearch: e.target.value})}
                    />
                    <button type="button" className="btn btn-outline" onClick={handleSearchStudent} disabled={searchingStudent}>
                      {searchingStudent ? "Đang tìm..." : "Tìm"}
                    </button>
                  </div>
                  {searchStudentResults.length > 0 && !createForm.selectedStudent && (
                    <div style={{ border: "1px solid var(--border)", borderRadius: "4px", maxHeight: "150px", overflowY: "auto" }}>
                      {searchStudentResults.map(s => (
                        <div 
                          key={s.id} 
                          style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                          onClick={() => handleSelectStudent(s)}
                        >
                          <div><strong>{s.student_code}</strong> - {s.full_name}</div>
                          <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{s.class_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {createForm.selectedStudent && (
                    <div style={{ padding: "10px", background: "var(--accent)", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>{createForm.selectedStudent.student_code}</strong> - {createForm.selectedStudent.full_name}
                      </div>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setCreateForm({...createForm, selectedStudent: null})}>Đổi</button>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>Học kỳ</label>
                  <input type="text" className="form-input" disabled value={settings?.current_semester || "Chưa cài đặt"} />
                </div>
                
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>Số tín chỉ</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      disabled
                      value={createForm.totalCredits}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>Giá tín chỉ</label>
                    <input type="text" className="form-input" disabled value={formatCurrency(settings?.credit_price || 0)} />
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "16px" }}>Tổng tiền cần nộp:</strong>
                  <span style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>
                    {formatCurrency((parseInt(createForm.totalCredits) || 0) * (parseInt(settings?.credit_price) || 0))}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)} disabled={creatingTuition}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={creatingTuition || !createForm.selectedStudent}>
                    {creatingTuition ? "Đang xử lý..." : "Tạo hóa đơn"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
