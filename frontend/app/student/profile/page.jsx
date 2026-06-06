
"use client"

import { useState, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import { useApi, useMutation } from "@/hooks/use-api"
import { profileService } from "@/lib/services/studentService"
import {
  User, Mail, Camera, Edit, Shield,
  GraduationCap, CheckCircle, X
} from "lucide-react"

function InfoItem(props) {
  var label = props.label
  var value = props.value
  var fullWidth = props.fullWidth || false

  return (
    <div className={"info-item" + (fullWidth ? " full-width" : "")}>
      <span className="info-label">{label}</span>
      <span className="info-value">{value || "—"}</span>
    </div>
  )
}

function EditModal(props) {
  var title = props.title
  var fields = props.fields
  var initialData = props.initialData
  var onSave = props.onSave
  var onClose = props.onClose
  var saving = props.saving

  var [formData, setFormData] = useState(initialData || {})

  function handleChange(key, value) {
    setFormData(function (prev) {
      return Object.assign({}, prev, { [key]: value })
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100,
    }}>
      <div style={{
        background: "var(--card)", borderRadius: "0.75rem",
        padding: "2rem", maxWidth: "500px", width: "90%",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontWeight: 700, fontSize: "1.125rem" }}>{title}</h3>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "1rem" }}>
            {fields.map(function (field) {
              return (
                <div key={field.key} className="form-group">
                  <label className="form-label">{field.label}</label>
                  {field.type === "select" ? (
                    <select
                      className="form-select"
                      value={formData[field.key] || ""}
                      onChange={function (e) { handleChange(field.key, e.target.value) }}
                    >
                      {field.options && field.options.map(function (opt) {
                        return (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        )
                      })}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      className="form-input"
                      rows={3}
                      value={formData[field.key] || ""}
                      onChange={function (e) { handleChange(field.key, e.target.value) }}
                      placeholder={field.placeholder || ""}
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      className="form-input"
                      value={formData[field.key] || ""}
                      onChange={function (e) { handleChange(field.key, e.target.value) }}
                      placeholder={field.placeholder || ""}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [editSection, setEditSection] = useState(null)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const { data: student, loading, refetch } = useApi(
    profileService.getProfile,
    [],
    { defaultData: null }
  )

  const fileInputRef = useRef(null)

  const { mutate: updateAvatar, loading: updatingAvatar } = useMutation(
    profileService.updateAvatar,
    {
      onSuccess: function () { showSuccess("Cập nhật ảnh đại diện thành công") },
      onError: function (err) { showError(err.message) },
    }
  )

  function handleAvatarChange(e) {
    var file = e.target.files[0]
    if (!file) return
    var formData = new FormData()
    formData.append('avatar', file)
    updateAvatar(formData)
    e.target.value = "" // reset input
  }

  function showSuccess(msg) {
    setSuccessMsg(msg)
    setEditSection(null)
    refetch()
    setTimeout(function () { setSuccessMsg("") }, 3000)
  }

  function showError(msg) {
    setErrorMsg(msg)
    setTimeout(function () { setErrorMsg("") }, 4000)
  }

  const { mutate: savePersonal, loading: savingPersonal } = useMutation(
    profileService.updatePersonal,
    {
      onSuccess: function () { showSuccess("Cập nhật thông tin cá nhân thành công") },
      onError: function (err) { showError(err.message) },
    }
  )

  const { mutate: saveContact, loading: savingContact } = useMutation(
    profileService.updateContact,
    {
      onSuccess: function () { showSuccess("Cập nhật thông tin liên hệ thành công") },
      onError: function (err) { showError(err.message) },
    }
  )

  const { mutate: saveFamily, loading: savingFamily } = useMutation(
    profileService.updateFamily,
    {
      onSuccess: function () { showSuccess("Cập nhật thông tin gia đình thành công") },
      onError: function (err) { showError(err.message) },
    }
  )

  if (loading) {
    return (
      <div className="dashboard-content">
        <Header title="Thông tin cá nhân" />
        <div className="dashboard-body">
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>
            Đang tải...
          </div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="dashboard-content">
        <Header title="Thông tin cá nhân" />
        <div className="dashboard-body">
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>
            Không tìm thấy thông tin sinh viên
          </div>
        </div>
      </div>
    )
  }

  var avatarChar = student.full_name
    ? student.full_name.split(" ").pop().charAt(0)
    : "S"

  function formatDate(dateStr) {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("vi-VN")
  }

  // Edit field configs
  var personalFields = [
    { key: "date_of_birth", label: "Ngày sinh", type: "date" },
    {
      key: "gender", label: "Giới tính", type: "select",
      options: [
        { value: "Nam", label: "Nam" },
        { value: "Nữ", label: "Nữ" },
        { value: "Khác", label: "Khác" },
      ],
    },
    { key: "ethnicity", label: "Dân tộc", type: "text" },
    { key: "religion", label: "Tôn giáo", type: "text" },
    { key: "id_number", label: "Số CCCD", type: "text" },
    { key: "id_issue_date", label: "Ngày cấp", type: "date" },
    { key: "id_issue_place", label: "Nơi cấp", type: "text" },
  ]

  var contactFields = [
    { key: "personal_email", label: "Email cá nhân", type: "email" },
    { key: "phone", label: "Số điện thoại", type: "tel" },
    { key: "permanent_address", label: "Địa chỉ thường trú", type: "textarea" },
    { key: "current_address", label: "Địa chỉ hiện tại", type: "textarea" },
  ]

  var familyFields = [
    { key: "father_name", label: "Họ tên cha", type: "text" },
    { key: "father_phone", label: "SĐT cha", type: "tel" },
    { key: "father_occupation", label: "Nghề nghiệp cha", type: "text" },
    { key: "mother_name", label: "Họ tên mẹ", type: "text" },
    { key: "mother_phone", label: "SĐT mẹ", type: "tel" },
    { key: "mother_occupation", label: "Nghề nghiệp mẹ", type: "text" },
  ]

  function getInitialData(fields) {
    var data = {}
    fields.forEach(function (f) {
      data[f.key] = student[f.key] || ""
    })
    return data
  }

  return (
    <div className="dashboard-content">
      <Header title="Thông tin cá nhân" />

      <div className="dashboard-body">
        {successMsg && (
          <div style={{
            padding: "0.75rem 1rem", background: "#dcfce7",
            border: "1px solid #16a34a", borderRadius: "0.5rem",
            color: "#166534", fontSize: "0.875rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <CheckCircle size={16} />
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

        {/* Profile Header */}
        <div className="profile-header-card">
          <div className="profile-header-content">
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                {student.avatar ? (
                  <img src={student.avatar} alt="Avatar" className="profile-avatar-large" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  <div className="profile-avatar-large">{avatarChar}</div>
                )}
                <button 
                  className="profile-avatar-edit" 
                  title="Đổi ảnh đại diện" 
                  onClick={function() { fileInputRef.current && fileInputRef.current.click() }}
                  disabled={updatingAvatar}
                >
                  <Camera size={16} />
                </button>
                <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleAvatarChange} />
              </div>
              <div className="profile-basic-info">
                <h1 className="profile-name">{student.full_name}</h1>
                <p className="profile-id">{student.student_code}</p>
                <span className="badge badge-success">{student.status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-grid">
          {/* Personal Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title"><User /> Thông tin cá nhân</h2>
            </div>
            <div className="card-content">
              <div className="info-grid">
                <InfoItem label="Họ và tên" value={student.full_name} />
                <InfoItem label="Ngày sinh" value={formatDate(student.date_of_birth)} />
                <InfoItem label="Giới tính" value={student.gender} />
                <InfoItem label="Dân tộc" value={student.ethnicity} />
                <InfoItem label="Tôn giáo" value={student.religion} />
                <InfoItem label="Số CCCD" value={student.id_number} />
                <InfoItem label="Ngày cấp" value={formatDate(student.id_issue_date)} />
                <InfoItem label="Nơi cấp" value={student.id_issue_place} fullWidth />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title"><Mail /> Thông tin liên hệ</h2>
              <button
                className="btn btn-outline btn-sm"
                onClick={function () { setEditSection("contact") }}
              >
                <Edit size={14} /> Chỉnh sửa
              </button>
            </div>
            <div className="card-content">
              <div className="info-grid">
                <InfoItem label="Email sinh viên" value={student.email} />
                <InfoItem label="Email cá nhân" value={student.personal_email} />
                <InfoItem label="Số điện thoại" value={student.phone} />
                <InfoItem label="Địa chỉ thường trú" value={student.permanent_address} fullWidth />
                <InfoItem label="Địa chỉ hiện tại" value={student.current_address} fullWidth />
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title"><GraduationCap /> Thông tin học tập</h2>
            </div>
            <div className="card-content">
              <div className="info-grid">
                <InfoItem label="Mã sinh viên" value={student.student_code} />
                <InfoItem label="Khoa" value={student.department_name} />
                <InfoItem label="Ngành học" value={student.major_name} />
                <InfoItem label="Lớp" value={student.class_code} />
                <InfoItem label="Khóa học" value={student.academic_year} />
                <InfoItem label="Hệ đào tạo" value={student.training_system} />
                <div className="info-item">
                  <span className="info-label">Trạng thái</span>
                  <span className="badge badge-success">{student.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Family Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title"><Shield /> Thông tin gia đình</h2>
              <button
                className="btn btn-outline btn-sm"
                onClick={function () { setEditSection("family") }}
              >
                <Edit size={14} /> Chỉnh sửa
              </button>
            </div>
            <div className="card-content">
              <div className="info-grid">
                <InfoItem label="Họ tên cha" value={student.father_name} />
                <InfoItem label="SĐT cha" value={student.father_phone} />
                <InfoItem label="Nghề nghiệp cha" value={student.father_occupation} />
                <InfoItem label="Họ tên mẹ" value={student.mother_name} />
                <InfoItem label="SĐT mẹ" value={student.mother_phone} />
                <InfoItem label="Nghề nghiệp mẹ" value={student.mother_occupation} />
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modals */}
        {editSection === "personal" && (
          <EditModal
            title="Chỉnh sửa thông tin cá nhân"
            fields={personalFields}
            initialData={getInitialData(personalFields)}
            onSave={savePersonal}
            onClose={function () { setEditSection(null) }}
            saving={savingPersonal}
          />
        )}
        {editSection === "contact" && (
          <EditModal
            title="Chỉnh sửa thông tin liên hệ"
            fields={contactFields}
            initialData={getInitialData(contactFields)}
            onSave={saveContact}
            onClose={function () { setEditSection(null) }}
            saving={savingContact}
          />
        )}
        {editSection === "family" && (
          <EditModal
            title="Chỉnh sửa thông tin gia đình"
            fields={familyFields}
            initialData={getInitialData(familyFields)}
            onSave={saveFamily}
            onClose={function () { setEditSection(null) }}
            saving={savingFamily}
          />
        )}
      </div>
    </div>
  )
}