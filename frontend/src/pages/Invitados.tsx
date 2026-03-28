import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit, Search, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Guest, GuestPriority, GuestStatus } from '../types';
import clsx from 'clsx';

const priorityColors: Record<GuestPriority, string> = {
  A: 'bg-rose-100 text-rose-700 border-rose-200',
  B: 'bg-amber-100 text-amber-700 border-amber-200',
  C: 'bg-stone-100 text-stone-600 border-stone-200',
};

const statusColors: Record<GuestStatus, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmado: 'bg-emerald-100 text-emerald-700',
  declinado: 'bg-red-100 text-red-600',
};

export default function Invitados({ store }: { store: ReturnType<typeof useStore> }) {
  const { guests, addGuest, updateGuest, deleteGuest } = store;
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<GuestPriority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<GuestStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return guests.filter(g => {
      const matchSearch = `${g.nombre} ${g.apellido}`.toLowerCase().includes(search.toLowerCase());
      const matchPriority = filterPriority === 'all' || g.prioridad === filterPriority;
      const matchStatus = filterStatus === 'all' || g.status === filterStatus;
      return matchSearch && matchPriority && matchStatus;
    });
  }, [guests, search, filterPriority, filterStatus]);

  const totalPases = guests.reduce((s, g) => s + g.pases, 0);
  const confirmedPases = guests.filter(g => g.status === 'confirmado').reduce((s, g) => s + g.pases, 0);

  const handleExport = () => {
    const csv = ['Nombre,Apellido,Pases,Prioridad,Status,Teléfono,Mesa,Notas',
      ...guests.map(g => `${g.nombre},${g.apellido},${g.pases},${g.prioridad},${g.status},${g.telefono || ''},${g.mesa || ''},${g.notas || ''}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'invitados.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-800">Invitados</h2>
          <p className="text-stone-400 text-sm">{totalPases} pases totales · {confirmedPases} confirmados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 border border-stone-200 text-stone-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            <Download size={16} /> CSV
          </button>
          <button
            onClick={() => { setEditingGuest(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            <Plus size={18} /> Agregar
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {(['A', 'B', 'C'] as GuestPriority[]).map(p => {
          const guestsP = guests.filter(g => g.prioridad === p);
          const pases = guestsP.reduce((s, g) => s + g.pases, 0);
          const conf = guestsP.filter(g => g.status === 'confirmado').reduce((s, g) => s + g.pases, 0);
          return (
            <div key={p} className={clsx('rounded-2xl p-4 border', priorityColors[p])}>
              <div className="text-lg font-bold mb-1">Prioridad {p}</div>
              <div className="text-3xl font-bold">{pases}</div>
              <div className="text-xs mt-1 opacity-70">{guestsP.length} familias · {conf} conf.</div>
            </div>
          );
        })}
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar invitado..."
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'A', 'B', 'C'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={clsx('px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                filterPriority === p ? 'bg-rose-500 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-rose-300'
              )}
            >
              {p === 'all' ? 'Todos' : p}
            </button>
          ))}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as GuestStatus | 'all')}
            className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          >
            <option value="all">Todos los status</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="declinado">Declinó</option>
          </select>
        </div>
      </div>

      {/* Guest table */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50">
            <tr>
              <th className="text-left px-6 py-3 text-stone-500 font-medium">Nombre</th>
              <th className="text-center px-4 py-3 text-stone-500 font-medium">Pases</th>
              <th className="text-center px-4 py-3 text-stone-500 font-medium">Prioridad</th>
              <th className="text-center px-4 py-3 text-stone-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium hidden md:table-cell">Mesa</th>
              <th className="text-right px-6 py-3 text-stone-500 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-stone-400">Sin resultados</td></tr>
            ) : filtered.map(guest => (
              <tr key={guest.id} className="hover:bg-stone-50">
                <td className="px-6 py-3">
                  <div className="font-medium text-stone-700">{guest.nombre} {guest.apellido}</div>
                  {guest.telefono && <div className="text-xs text-stone-400">{guest.telefono}</div>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-stone-100 text-stone-700 font-bold px-2.5 py-1 rounded-lg">
                    {guest.pases}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={clsx('text-xs font-bold px-2.5 py-1 rounded-lg border', priorityColors[guest.prioridad])}>
                    {guest.prioridad}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <select
                    value={guest.status}
                    onChange={e => updateGuest(guest.id, { status: e.target.value as GuestStatus })}
                    className={clsx('text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none', statusColors[guest.status])}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado ✓</option>
                    <option value="declinado">Declinó</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-stone-500 hidden md:table-cell">{guest.mesa || '—'}</td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setEditingGuest(guest); setShowModal(true); }}
                      className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm('¿Eliminar invitado?')) deleteGuest(guest.id); }}
                      className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <GuestModal
          guest={editingGuest}
          onSave={(data) => {
            if (editingGuest) updateGuest(editingGuest.id, data);
            else addGuest(data as Omit<Guest, 'id' | 'fechaCreacion'>);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function GuestModal({ guest, onSave, onClose }: {
  guest: Guest | null;
  onSave: (data: Partial<Guest>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    nombre: guest?.nombre || '',
    apellido: guest?.apellido || '',
    pases: guest?.pases?.toString() || '1',
    prioridad: guest?.prioridad || 'A' as GuestPriority,
    status: guest?.status || 'pendiente' as GuestStatus,
    telefono: guest?.telefono || '',
    email: guest?.email || '',
    mesa: guest?.mesa || '',
    acompanante: guest?.acompanante || '',
    notas: guest?.notas || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, pases: parseInt(form.pases) || 1 });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="font-serif text-xl font-bold mb-5">{guest ? 'Editar Invitado' : 'Nuevo Invitado'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Nombre *</label>
              <input
                required
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Apellido *</label>
              <input
                required
                value={form.apellido}
                onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Pases</label>
              <input
                type="number"
                min="1"
                value={form.pases}
                onChange={e => setForm(f => ({ ...f, pases: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Prioridad</label>
              <select
                value={form.prioridad}
                onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as GuestPriority }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="A">A - Prioritario</option>
                <option value="B">B - Secundario</option>
                <option value="C">C - Opcional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as GuestStatus }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="declinado">Declinó</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Mesa</label>
              <input
                value={form.mesa}
                onChange={e => setForm(f => ({ ...f, mesa: e.target.value }))}
                placeholder="Ej. Mesa 1"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Teléfono</label>
              <input
                value={form.telefono}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">Notas</label>
              <textarea
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl font-medium hover:bg-stone-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl font-medium transition-colors">
              {guest ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
