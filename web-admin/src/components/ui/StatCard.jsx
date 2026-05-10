export default function StatCard({
  title, value, subtitle, color = 'blue', trend
}) {
  const colors = {
    blue:   'text-blue-400',
    green:  'text-green-400',
    amber:  'text-amber-400',
    red:    'text-red-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="bg-[#161b27] border border-[#2e3a50] rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-2">
        {title}
      </p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
      {trend && (
        <p className={`text-xs mt-2 ${trend.up ? 'text-green-400' : 'text-red-400'}`}>
          {trend.up ? '↑' : '↓'} {trend.label}
        </p>
      )}
    </div>
  );
}