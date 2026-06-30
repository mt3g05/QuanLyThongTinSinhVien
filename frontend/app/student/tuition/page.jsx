"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { useApi, useMutation } from "@/hooks/use-api"
import { tuitionService } from "@/lib/services/studentService"
import {
  CreditCard, Download, CheckCircle,
  Clock, AlertCircle, FileText,
  Calendar, Printer, Wallet, ChevronDown
} from "lucide-react"

function formatCurrency(amount) {
  if (amount == null) return "—"
  return Number(amount).toLocaleString("vi-VN") + "đ"
}

function formatDate(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("vi-VN")
}

export default function TuitionPage() {
  const [selectedSemester, setSelectedSemester] = useState("ALL")
  const [selectedMethod, setSelectedMethod] = useState("bank_transfer")
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Fetch tuition history (used for 'All' view and populating the dropdown)
  const { data: history, loading: historyLoading, refetch: refetchHistory } = useApi(
    tuitionService.getHistory,
    [],
    { defaultData: [] }
  )

  // Fetch details for specific semester
  const { data: detailsData, loading: detailsLoading, refetch: refetchDetails } = useApi(
    function () {
      if (selectedSemester === "ALL") return Promise.resolve({ data: { tuition: null, courses: [] } })
      return tuitionService.getDetailsBySemester(selectedSemester)
    },
    [],
    { defaultData: { tuition: null, courses: [] } }
  )

  useEffect(function () {
    if (selectedSemester !== "ALL") {
      refetchDetails()
    }
  }, [selectedSemester])

  const { data: paymentMethods, loading: methodsLoading } = useApi(
    tuitionService.getPaymentMethods,
    [],
    { defaultData: [] }
  )

  const { data: bankInfo } = useApi(
    tuitionService.getBankInfo,
    [],
    { defaultData: null }
  )

  const { mutate: pay, loading: paying } = useMutation(
    tuitionService.pay,
    {
      onSuccess: function () {
        setSuccessMsg("Thanh toán thành công!")
        refetchHistory()
        if (selectedSemester !== "ALL") refetchDetails()
        setTimeout(function () { setSuccessMsg("") }, 3000)
      },
      onError: function (err) {
        setErrorMsg(err.message || "Lỗi khi thanh toán")
        setTimeout(function () { setErrorMsg("") }, 4000)
      },
    }
  )

  var historyList = Array.isArray(history) ? history : []
  var semesters = historyList.map(function (h) { return h.semester })
  
  var methodsList = Array.isArray(paymentMethods) ? paymentMethods : []

  function handlePay() {
    if (!detailsData || !detailsData.tuition || !detailsData.tuition.id) {
      setErrorMsg("Không tìm thấy thông tin học phí để thanh toán")
      return
    }
    pay(detailsData.tuition.id, selectedMethod)
  }

  // Calculate totals for 'ALL' view
  var totalAmountBeforeDiscountAll = 0
  var totalDiscountAll = 0
  var totalPayableAll = 0
  var totalPaidAll = 0
  var totalRemainingAll = 0

  historyList.forEach(function (item) {
    totalAmountBeforeDiscountAll += (Number(item.total_amount) + Number(item.discount))
    totalDiscountAll += Number(item.discount)
    totalPayableAll += Number(item.total_amount)
    totalPaidAll += Number(item.paid_amount)
    totalRemainingAll += Number(item.remaining)
  })

  // Specific semester data
  var specificTuition = detailsData ? detailsData.tuition : null
  var specificCourses = detailsData && detailsData.courses ? detailsData.courses : []

  return (
    <div className="dashboard-content">
      <Header title="Học phí" />

      <div className="dashboard-body">
        {successMsg && (
          <div style={{
            padding: "0.75rem 1rem", background: "#dcfce7",
            border: "1px solid #16a34a", borderRadius: "0.5rem",
            color: "#166534", fontSize: "0.875rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
            marginBottom: "1rem"
          }}>
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{
            padding: "0.75rem 1rem", background: "#fee2e2",
            border: "1px solid #dc2626", borderRadius: "0.5rem",
            color: "#991b1b", fontSize: "0.875rem",
            marginBottom: "1rem"
          }}>
            {errorMsg}
          </div>
        )}

        {/* Filter Section */}
        <div className="grades-controls" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted-foreground)' }}>Bộ lọc:</span>
            
            <div className="semester-select-wrapper">
              <select
                className="semester-select"
                value={selectedSemester}
                onChange={function(e) { setSelectedSemester(e.target.value) }}
                disabled={historyLoading}
              >
                <option value="ALL">Tất cả các kỳ</option>
                {semesters.map(function(sem) {
                  return <option key={sem} value={sem}>{sem}</option>
                })}
              </select>
              <ChevronDown className="semester-select-icon" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        {selectedSemester === "ALL" ? (
          /* ================= ALL SEMESTERS VIEW ================= */
          <div className="card">
            <div className="card-header">
              <h2 className="card-title"><Calendar /> Tổng hợp học phí các kỳ</h2>
            </div>
            <div className="card-content">
              {historyLoading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted-foreground)" }}>
                  Đang tải...
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted-foreground)" }}>
                  Chưa có dữ liệu học phí
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="table grades-table">
                    <thead>
                      <tr>
                        <th className="text-center">STT</th>
                        <th>Học kỳ năm học</th>
                        <th className="text-right">HP chưa giảm</th>
                        <th className="text-right">Miễn giảm</th>
                        <th className="text-right">Phải thu</th>
                        <th className="text-right">Đã thu</th>
                        <th className="text-right">Còn nợ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyList.map(function (item, idx) {
                        var amountBefore = Number(item.total_amount) + Number(item.discount)
                        return (
                          <tr key={item.id}>
                            <td className="text-center">{idx + 1}</td>
                            <td className="font-medium">{item.semester}</td>
                            <td className="text-right">{formatCurrency(amountBefore)}</td>
                            <td className="text-right text-success">{formatCurrency(item.discount)}</td>
                            <td className="text-right font-semibold text-primary">{formatCurrency(item.total_amount)}</td>
                            <td className="text-right">{formatCurrency(item.paid_amount)}</td>
                            <td className="text-right font-semibold text-danger">{formatCurrency(item.remaining)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="grades-summary-row" style={{ background: 'var(--muted)', fontWeight: 'bold' }}>
                        <td colSpan={2} className="text-right">Tổng toàn bộ:</td>
                        <td className="text-right">{formatCurrency(totalAmountBeforeDiscountAll)}</td>
                        <td className="text-right text-success">{formatCurrency(totalDiscountAll)}</td>
                        <td className="text-right text-primary">{formatCurrency(totalPayableAll)}</td>
                        <td className="text-right">{formatCurrency(totalPaidAll)}</td>
                        <td className="text-right text-danger">{formatCurrency(totalRemainingAll)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
<<<<<<< Updated upstream
=======
            </div>
            
            <div className="card" style={{ padding: '1.5rem', background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.2)', textAlign: 'center' }}>
               <h3 style={{ color: '#0284c7', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                 <AlertCircle size={20} /> Hướng dẫn thanh toán
               </h3>
               <p style={{ color: 'var(--muted-foreground)' }}>
                 Để xem chi tiết hóa đơn và các phương thức thanh toán, vui lòng chọn một <strong>Học kỳ cụ thể</strong> ở bộ lọc phía trên.
               </p>
            </div>
>>>>>>> Stashed changes
          </div>
        ) : (
          /* ================= SPECIFIC SEMESTER VIEW ================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <h2 className="card-title"><FileText /> Danh sách phải thu — {selectedSemester}</h2>
              </div>
              <div className="card-content">
                {detailsLoading ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted-foreground)" }}>
                    Đang tải chi tiết...
                  </div>
                ) : !specificTuition ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted-foreground)" }}>
                    Không tìm thấy dữ liệu cho học kỳ này
                  </div>
                ) : (
                  <div>
                    <div className="table-wrapper" style={{ marginBottom: '1.5rem' }}>
                      <table className="table grades-table">
                        <thead>
                          <tr>
                            <th className="text-center">STT</th>
                            <th>Tên môn học</th>
                            <th className="text-center">Số tín chỉ</th>
                            <th className="text-right">Số tiền</th>
                            <th className="text-right">Miễn giảm</th>
                            <th className="text-right">Phải thu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {specificCourses.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center text-muted" style={{ padding: '1rem' }}>
                                Không có môn học nào hoặc chưa có điểm
                              </td>
                            </tr>
                          ) : (
                            specificCourses.map(function(course, idx) {
                              return (
                                <tr key={idx}>
                                  <td className="text-center">{idx + 1}</td>
                                  <td className="font-medium">{course.course_name}</td>
                                  <td className="text-center">{course.credits}</td>
                                  <td className="text-right">{formatCurrency(course.amount)}</td>
                                  <td className="text-right">{formatCurrency(course.discount)}</td>
                                  <td className="text-right font-semibold">{formatCurrency(course.final_amount)}</td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="grades-summary-row" style={{ background: 'var(--muted)' }}>
                            <td colSpan={3} className="text-right font-semibold">Tổng môn học:</td>
                            <td className="text-right font-semibold">{formatCurrency(Number(specificTuition.total_amount) + Number(specificTuition.discount))}</td>
                            <td className="text-right font-semibold text-success">{formatCurrency(specificTuition.discount)}</td>
                            <td className="text-right font-bold text-primary">{formatCurrency(specificTuition.total_amount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '1.125rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '1rem 2rem', textAlign: 'right' }}>
                        <span className="font-semibold">Đã thu:</span>
                        <span className="font-bold text-success">{formatCurrency(specificTuition.paid_amount)}</span>
                        
                        <span className="font-semibold">Còn nợ:</span>
                        <span className="font-bold text-danger">{formatCurrency(specificTuition.remaining)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Section (only show if remaining > 0 and not pending) */}
            {specificTuition && Number(specificTuition.remaining) > 0 && specificTuition.status === 'Chưa thanh toán' && (
              <div className="card" style={{ border: '2px solid var(--primary)', overflow: 'hidden' }}>
                <div className="card-header" style={{ background: 'rgba(185, 28, 28, 0.05)' }}>
                  <h2 className="card-title text-primary"><Wallet /> Thanh toán khoản nợ</h2>
                </div>
                <div className="card-content">
                  <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>1. Chọn phương thức thanh toán:</h3>
                  <div className="payment-methods" style={{ marginBottom: '2rem' }}>
                    {methodsList.map(function (method) {
                      var isSelected = selectedMethod === method.id
                      return (
                        <div
                          key={method.id}
                          className="payment-method-item"
                          onClick={function () { setSelectedMethod(method.id) }}
                          style={{
                            borderColor: isSelected ? "var(--primary)" : undefined,
                            background: isSelected ? "rgba(185,28,28,0.05)" : undefined,
                            cursor: "pointer",
                          }}
                        >
                          <div className="payment-method-icon">
                            <CreditCard />
                          </div>
                          <div className="payment-method-info">
                            <span className="payment-method-name">{method.name}</span>
                            <span className="payment-method-desc">{method.description}</span>
                          </div>
                          {isSelected && (
                            <CheckCircle size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Bank Transfer Info */}
                  {bankInfo && selectedMethod === "bank_transfer" && (
                    <div className="bank-info" style={{ marginBottom: '2rem' }}>
                      <h4 className="bank-info-title">Thông tin chuyển khoản:</h4>
                      <div className="bank-info-content">
                        <p><strong>Ngân hàng:</strong> {bankInfo.bankName}</p>
                        <p><strong>Số TK:</strong> {bankInfo.accountNumber}</p>
                        <p><strong>Chủ TK:</strong> {bankInfo.accountHolder}</p>
                        <p><strong>Nội dung:</strong> {bankInfo.content}</p>
                        {bankInfo.note && (
                          <p style={{ marginTop: "0.5rem", fontSize: "12px", color: "var(--muted-foreground)" }}>
                            * {bankInfo.note}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-primary btn-lg"
                    style={{ width: "100%" }}
                    onClick={handlePay}
                    disabled={paying}
                  >
                    <Wallet />
                    {paying ? "Đang xử lý..." : "Xác nhận đã nộp " + formatCurrency(specificTuition.remaining)}
                  </button>
                </div>
              </div>
            )}
            
            {/* Pending Confirmation Section */}
            {specificTuition && specificTuition.status === 'Chờ xác nhận' && (
              <div className="card" style={{ border: '2px solid #eab308', overflow: 'hidden' }}>
                <div className="card-header" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
                  <h2 className="card-title" style={{ color: '#ca8a04' }}><Clock /> Đang chờ xác nhận</h2>
                </div>
                <div className="card-content" style={{ padding: '2rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Bạn đã gửi yêu cầu xác nhận đã nộp tiền.</p>
                  <p style={{ color: 'var(--muted-foreground)' }}>Vui lòng chờ nhà trường (Admin) kiểm tra và cập nhật trạng thái hóa đơn.</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
