import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from 'recharts';

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm p-4">
    <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>
    <div className="h-56">{children}</div>
  </div>
);

export function IncidenciasPorEstadoChart({ resumen }) {
  const data = [
    { nombre: 'Abiertas', cantidad: resumen.abiertas, color: '#3b82f6' },
    { nombre: 'En proceso', cantidad: resumen.en_proceso, color: '#f97316' },
    { nombre: 'Críticas', cantidad: resumen.criticas, color: '#ef4444' },
  ];

  return (
    <ChartCard title="Incidencias por estado">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#f9fafb' }} />
          <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
            {data.map((d) => <Cell key={d.nombre} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function InventarioAlertaChart({ resumen }) {
  const enAlerta = resumen.articulosEnAlerta || 0;
  const normales = Math.max((resumen.totalItems || 0) - enAlerta, 0);
  const data = [
    { nombre: 'En alerta', valor: enAlerta, color: '#ef4444' },
    { nombre: 'Normal', valor: normales, color: '#e5ba4a' },
  ];

  return (
    <ChartCard title="Artículos en alerta de stock">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="valor" nameKey="nombre" innerRadius={50} outerRadius={75} paddingAngle={2}>
            {data.map((d) => <Cell key={d.nombre} fill={d.color} />)}
          </Pie>
          <Tooltip />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CitasPendientesChart({ resumen }) {
  const pendientes = resumen.citasPendientes || 0;
  const resto = Math.max((resumen.totalCitas || 0) - pendientes, 0);
  const data = [
    { nombre: 'Pendientes', valor: pendientes, color: '#f97316' },
    { nombre: 'Resto', valor: resto, color: '#3b82f6' },
  ];

  return (
    <ChartCard title="Citas pendientes">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="valor" nameKey="nombre" innerRadius={50} outerRadius={75} paddingAngle={2}>
            {data.map((d) => <Cell key={d.nombre} fill={d.color} />)}
          </Pie>
          <Tooltip />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
