import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', boxShadow: 'var(--shadow-card)' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 8 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: '0.9rem', fontWeight: 600 }}>
          {p.name}: ${Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="chart-card card">
        <p className="chart-title">Monthly Income vs Expense</p>
        <div className="empty-state">
          <span style={{ fontSize: 40 }}>📈</span>
          <p>No monthly data yet. Add some transactions!</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    month:   d.month,
    Income:  parseFloat(d.income)  || 0,
    Expense: parseFloat(d.expense) || 0,
  }));

  return (
    <div className="chart-card card">
      <p className="chart-title">Monthly Income vs Expense (12 months)</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingTop: 12 }}
          />
          <Bar dataKey="Income"  fill="var(--income)"  radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="Expense" fill="var(--expense)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
