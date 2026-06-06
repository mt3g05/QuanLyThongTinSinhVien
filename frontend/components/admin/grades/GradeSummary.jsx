import { FileText, CheckCircle, Clock } from "lucide-react";

export function GradeSummary({ statsLoading, stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {/* Total Grades */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          <FileText size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Tổng bảng điểm</p>
          <h3 className="text-2xl font-bold text-slate-800">
            {statsLoading ? "..." : stats?.total || 0}
          </h3>
        </div>
      </div>

      {/* Approved Grades */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Đã duyệt</p>
          <h3 className="text-2xl font-bold text-slate-800">
            {statsLoading ? "..." : stats?.approved || 0}
          </h3>
        </div>
      </div>

      {/* Pending Grades */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
          <Clock size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Chờ duyệt</p>
          <h3 className="text-2xl font-bold text-slate-800">
            {statsLoading ? "..." : stats?.pending || 0}
          </h3>
        </div>
      </div>
    </div>
  );
}
