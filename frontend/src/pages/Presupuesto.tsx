import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import clsx from 'clsx';

const formatMXN = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount);

export default function Presupuesto({ store }: { store: ReturnType<typeof useStore> }) {
  const { vendors, config, stats } = store;

  const allPayments = vendors
    .flatMap(v => v.pagos.map(p => ({ ...p, vendorNombre: v.nombre, vendorCat: v.categoria })))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const categoryData = vendors
    .filter(v => v.contratado)
    .reduce((acc, v) => {
      const costo = v.costoPorPersona ? v.costoTotal * stats.totalInvitados : v.costoTotal;
      const pagado = v.pagos.reduce((s, p) => s + p.monto, 0);
      if (!acc[v.categoria]) acc[v.categoria] = { categoria: v.categoria, total: 0, pagado: 0 };
      acc[v.categoria].total += costo;
      acc[v.categoria].pagado += pagado;
      return acc;
    }, {} as Record<string, { categoria: string; total: number; pagado: number }>);

  const chartData = Object.values(categoryData)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map(d => ({
      name: d.categoria.length > 14 ? d.categoria.substring(0, 14) + '…' : d.categoria,
      total: d.total,
      pagado: d.pagado,
      pendiente: d.total - d.pagado,
    }));

  const budgetPercent = config.presupuestoTotal > 0
    ? Math.min(100, (stats.totalCosto / config.presupuestoTotal) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-stone-800">Presupuesto</h2>
        <p className="text-stone-400 text-sm">Control financiero de tu boda</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
          <div className="text-xs text-stone-400 mb-1">Presupuesto Total</div>
          <div className="text-2xl font-bold text-stone-700">{formatMXN(config.presupuestoTotal)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
          <div className="text-xs text-stone-400 mb-1">Costo Estimado</div>
          <div className={clsx('text-2xl font-bold', budgetPercent > 100 ? 'text-red-500' : 'text-stone-700')}>
            {formatMXN(stats.totalCosto)}
          </div>
          {budgetPercent > 100 && <div className="text-xs text-red-400 mt-1">⚠️ Excede presupuesto</div>}
        </div>
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-sm">
          <div className="text-xs text-emerald-600 mb-1">Total Pagado</div>
          <div className="text-2xl font-bold text-emerald-700">{formatMXN(stats.totalPagado)}</div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 shadow-sm">
          <div className="text-xs text-amber-600 mb-1">Por Pagar</div>
          <div className="text-2xl font-bold text-amber-700">{formatMXN(stats.totalPendiente)}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-stone-700">Progreso de Pagos</h3>
          <span className="text-sm text-emerald-600 font-medium">{stats.porcentajePagado.toFixed(1)}% pagado</span>
        </div>
        <div className="h-5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${stats.porcentajePagado}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-stone-400 mt-2">
          <span>{formatMXN(stats.totalPagado)} pagado</span>
          <span>{formatMXN(stats.totalPendiente)} pendiente</span>
        </div>
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
          <h3 className="font-semibold text-stone-700 mb-4">Gastos por Categoría</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatMXN(v)} />
              <Legend />
              <Bar dataKey="pagado" name="Pagado" stackId="a" fill="#4ade80" />
              <Bar dataKey="pendiente" name="Pendiente" stackId="a" fill="#fca5a5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Vendor detail table */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h3 className="font-semibold text-stone-700">Detalle por Proveedor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left px-6 py-3 text-stone-500 font-medium">Proveedor</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Categoría</th>
                <th className="text-right px-4 py-3 text-stone-500 font-medium">Total</th>
                <th className="text-right px-4 py-3 text-stone-500 font-medium">Pagado</th>
                <th className="text-right px-6 py-3 text-stone-500 font-medium">Pendiente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {vendors.filter(v => v.contratado).length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-stone-400">Sin proveedores contratados</td></tr>
              ) : vendors.filter(v => v.contratado).map(vendor => {
                const costoReal = vendor.costoPorPersona ? vendor.costoTotal * stats.totalInvitados : vendor.costoTotal;
                const pagado = vendor.pagos.reduce((s, p) => s + p.monto, 0);
                const pendiente = costoReal - pagado;
                return (
                  <tr key={vendor.id} className="hover:bg-stone-50">
                    <td className="px-6 py-3 font-medium text-stone-700">{vendor.nombre}</td>
                    <td className="px-4 py-3 text-stone-400">{vendor.categoria}</td>
                    <td className="px-4 py-3 text-right text-stone-700">{formatMXN(costoReal)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatMXN(pagado)}</td>
                    <td className={clsx('px-6 py-3 text-right font-medium', pendiente > 0 ? 'text-rose-500' : 'text-stone-400')}>
                      {formatMXN(pendiente)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {vendors.filter(v => v.contratado).length > 0 && (
              <tfoot className="bg-stone-50 border-t-2 border-stone-200">
                <tr>
                  <td colSpan={2} className="px-6 py-3 font-bold text-stone-700">TOTAL</td>
                  <td className="px-4 py-3 text-right font-bold text-stone-700">{formatMXN(stats.totalCosto)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatMXN(stats.totalPagado)}</td>
                  <td className="px-6 py-3 text-right font-bold text-rose-500">{formatMXN(stats.totalPendiente)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Recent payments */}
      {allPayments.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h3 className="font-semibold text-stone-700">Últimos Pagos</h3>
          </div>
          <div className="divide-y divide-stone-100">
            {allPayments.slice(0, 10).map(p => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <div className="font-medium text-stone-700 text-sm">{p.vendorNombre}</div>
                  <div className="text-xs text-stone-400">{p.concepto} · {new Date(p.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="text-emerald-600 font-semibold">{formatMXN(p.monto)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
