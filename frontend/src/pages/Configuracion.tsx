import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Save } from 'lucide-react';

const formatMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function Configuracion({ store }: { store: ReturnType<typeof useStore> }) {
  const { config, updateConfig, stats } = store;
  const [form, setForm] = useState({ ...config });
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      ...form,
      presupuestoTotal: parseFloat(form.presupuestoTotal.toString()) || 0,
      invitadosEstimados: parseInt(form.invitadosEstimados.toString()) || 0
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h2 className="font-serif text-2xl font-bold text-stone-800">Configuración</h2>
        <p className="text-stone-400 text-sm">Datos generales de tu boda</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Nombre de la Novia</label>
            <input
              value={form.nombreNovia}
              onChange={e => setForm(f => ({ ...f, nombreNovia: e.target.value }))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Nombre del Novio</label>
            <input
              value={form.nombreNovio}
              onChange={e => setForm(f => ({ ...f, nombreNovio: e.target.value }))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Fecha de la Boda</label>
            <input
              type="date"
              value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Lugar / Venue</label>
            <input
              value={form.venue}
              onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="Ej. Hacienda San Miguel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Presupuesto Total (MXN)</label>
            <input
              type="number"
              value={form.presupuestoTotal}
              onChange={e => setForm(f => ({ ...f, presupuestoTotal: parseFloat(e.target.value) || 0 }))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Invitados Estimados</label>
            <input
              type="number"
              value={form.invitadosEstimados}
              onChange={e => setForm(f => ({ ...f, invitadosEstimados: parseInt(e.target.value) || 0 }))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Save size={16} /> {saved ? '¡Guardado! ✓' : 'Guardar Cambios'}
        </button>
      </form>

      {/* Stats summary */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-100">
        <h3 className="font-semibold text-stone-700 mb-4">Resumen General</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Total invitados:</span>
            <span className="font-medium">{stats.totalInvitados} pases</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Confirmados:</span>
            <span className="font-medium text-emerald-600">{stats.confirmados}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Costo estimado:</span>
            <span className="font-medium">{formatMXN(stats.totalCosto)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Costo/persona:</span>
            <span className="font-medium">{formatMXN(stats.costoPorPersona)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Total pagado:</span>
            <span className="font-medium text-emerald-600">{formatMXN(stats.totalPagado)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Por pagar:</span>
            <span className="font-medium text-rose-500">{formatMXN(stats.totalPendiente)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
