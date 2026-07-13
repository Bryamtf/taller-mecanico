export default function KpiCard({ icon: Icon, label, value, iconBgClass = 'bg-blue-50', iconColorClass = 'text-blue-500' }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
      <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${iconBgClass}`}>
        <Icon size={16} className={iconColorClass} />
      </div>
      <div className="text-center sm:text-left">
        <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{value}</p>
        <p className="text-[11px] sm:text-xs text-[#bababa] mt-0.5">{label}</p>
      </div>
    </div>
  );
}
