import { BarChart3 } from "lucide-react";

export function GradeDistribution({ distList }) {
  if (!distList || distList.length === 0) return null;

  const maxCount = Math.max(...distList.map(d => d.count));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-primary w-5 h-5" /> Phân bố điểm số
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {distList.map((item, idx) => {
            const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            let colorClass = "bg-red-500 text-red-600";
            if (item.letter_grade?.startsWith("A")) colorClass = "bg-green-600 text-green-700";
            else if (item.letter_grade?.startsWith("B")) colorClass = "bg-blue-600 text-blue-700";
            else if (item.letter_grade?.startsWith("C")) colorClass = "bg-amber-500 text-amber-600";

            return (
              <div key={idx} className="flex items-center gap-4">
                <span className={`w-10 text-sm font-bold ${colorClass.split(" ")[1]}`}>
                  {item.letter_grade}
                </span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colorClass.split(" ")[0]} transition-all duration-1000 ease-out`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-semibold text-slate-600">
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
