import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import clsx from 'clsx';

const COLORS = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#818cf8', '#fb7185'];

const formatMXN = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount);

const formatPercent = (n: number) => `${n.toFixed(1)}%`;

export default function Dashboard({ store }: { store: ReturnType<typeof useStore> }) {
  const { vendors, guests, config, stats } = store;

  const weddingDate = new Date(config.fecha);
  const today = new Date();
  const daysLeft = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const expensesByCategory = vendors
    .filter(v => v.contratado)
    .reduce((acc, v) => {
      const costo = v.costoPorPersona ? v.costoTotal * stats.totalInvitados : v.costoTotal;
      acc[v.categoria] = (acc[v.categoria] || 0) + costo;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const guestByPriority = [
    { name: 'A - Prioritarios', value: guests.filter(g => g.prioridad === 'A').reduce((s, g) => s + g.pases, 0), fill: '#f43f5e' },
    { name: 'B - Secundarios', value: guests.filter(g => g.prioridad === 'B').reduce((s, g) => s + g.pases, 0), fill: '#fb923c' },
    { name: 'C - Opcionales', value: guests.filter(g => g.prioridad === 'C').reduce((s, g) => s + g.pases, 0), fill: '#facc15' },
  ];

  const vendorPayments = vendors
    .filter(v => v.contratado)
    .map(v => {
      const pagado = v.pagos.reduce((s, p) => s + p.monto, 0);
      const total = v.costoPorPersona ? v.costoTotal * stats.totalInvitados : v.costoTotal;
      return {
        name: v.nombre.length > 12 ? v.nombre.substring(0, 12) + '…' : v.nombre,
        pagado,
        pendiente: Math.max(0, total - pagado),
      };
    })
    .filter(v => v.pagado > 0 || v.pendiente > 0)
    .slice(0, 8);

  const budgetPercent = config.presupuestoTotal > 0
    ? Math.min(100, (stats.totalCosto / config.presupuestoTotal) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-serif text-3xl font-bold mb-1">
              {config.nombreNovio} & {config.nombreNovia} 💍
            </h2>
            <p className="text-rose-100 text-lg">
              {weddingDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {config.venue && (
              <p className="text-rose-200 text-sm mt-1">📍 {config.venue}</p>
            )}
          </div>
          <div className="text-center bg-white/20 rounded-2xl px-8 py-4 backdrop-blur-sm">
            <div className="text-5xl font-bold font-serif">{daysLeft > 0 ? daysLeft : 0}</div>
            <div className="text-rose-100 text-sm mt-1">días restantes</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Invitados"
          value={stats.totalInvitados.toString()}
          subtitle={`${stats.confirmados} confirmados`}
          icon={<Users size={24} />}
          color="blue"
        />
        <KPICard
          title="Presupuesto Usado"
          value={formatMXN(stats.totalCosto)}
          subtitle={`${formatPercent(budgetPercent)} del total`}
          icon={<DollarSign size={24} />}
          color="rose"
        />
        <KPICard
          title="Pagado"
          value={formatMXN(stats.totalPagado)}
          subtitle={`${formatPercent(stats.porcentajePagado)} del costo`}
          icon={<CheckCircle size={24} />}
          color="green"
        />
        <KPICard
          title="Por Pagar"
          value={formatMXN(stats.totalPendiente)}
          subtitle={`Costo/persona: ${formatMXN(stats.costoPorPersona)}`}
          icon={<AlertCircle size={24} />}
          color="amber"
        />
      </div>

      {/* Budget progress bar */}
      {config.presupuestoTotal > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-stone-700">Presupuesto General</h3>
            <span className="text-sm text-stone-500">
              {formatMXN(stats.totalCosto)} / {formatMXN(config.presupuestoTotal)}
            </span>
          </div>
          <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all duration-500',
                budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              )}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-stone-400 mt-2">
            <span>0</span>
            <span className={budgetPercent > 90 ? 'text-red-500 font-medium' : ''}>
              {formatPercent(budgetPercent)} utilizado
            </span>
            <span>{formatMXN(config.presupuestoTotal)}</span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by category */}
        {pieData.length > 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h3 className="font-semibold text-stone-700 mb-4">Gastos por Categoría</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatMXN(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex items-center justify-center">
            <div className="text-center text-stone-400">
              <div className="text-4xl mb-2">💰</div>
              <p className="font-medium">Sin gastos registrados</p>
              <p className="text-sm">Agrega proveedores contratados para ver el desglose</p>
            </div>
          </div>
        )}

        {/* Guest breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-700 mb-4">Invitados por Prioridad</h3>
          <div className="space-y-4 mb-6">
            {guestByPriority.map(g => (
              <div key={g.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-600">{g.name}</span>
                  <span className="font-medium">{g.value} pases</span>
                </div>
                <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: stats.totalInvitados > 0 ? `${(g.value / stats.totalInvitados) * 100}%` : '0%',
                      backgroundColor: g.fill
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">{stats.confirmados}</div>
              <div className="text-xs text-stone-400">Confirmados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">{stats.pendientesRespuesta}</div>
              <div className="text-xs text-stone-400">Pendientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.declinados}</div>
              <div className="text-xs text-stone-400">Declinados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment bar chart */}
      {vendorPayments.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-700 mb-4">Estado de Pagos por Proveedor</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={vendorPayments} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatMXN(v)} />
              <Legend />
              <Bar dataKey="pagado" name="Pagado" stackId="a" fill="#4ade80" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pendiente" name="Pendiente" stackId="a" fill="#fca5a5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
          <div className="text-rose-400 text-sm font-medium mb-1">Proveedores Contratados</div>
          <div className="text-3xl font-bold text-rose-600">{vendors.filter(v => v.contratado).length}</div>
          <div className="text-rose-400 text-xs mt-1">de {vendors.length} registrados</div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
          <div className="text-amber-600 text-sm font-medium mb-1">Costo por Persona</div>
          <div className="text-3xl font-bold text-amber-700">{formatMXN(stats.costoPorPersona)}</div>
          <div className="text-amber-500 text-xs mt-1">basado en {stats.totalInvitados} pases</div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
          <div className="text-emerald-600 text-sm font-medium mb-1">Pendiente por Pagar</div>
          <div className="text-3xl font-bold text-emerald-700">{formatMXN(stats.totalPendiente)}</div>
          <div className="text-emerald-500 text-xs mt-1">{formatPercent(100 - stats.porcentajePagado)} del total</div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, subtitle, icon, color }: {
  title: string; value: string; subtitle: string; icon: React.ReactNode;
  color: 'blue' | 'rose' | 'green' | 'amber'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return (
    <div className={clsx('rounded-2xl p-5 border', colorMap[color])}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-medium opacity-70">{title}</span>
        <span className="opacity-60">{icon}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-60">{subtitle}</div>
    </div>
  );
}
