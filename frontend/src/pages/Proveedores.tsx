import { useState } from 'react';
import { Plus, Trash2, Edit, CheckCircle, DollarSign } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Vendor, VendorCategory, Payment } from '../types';
import clsx from 'clsx';

const CATEGORIES: VendorCategory[] = [
  'Banquetero', 'Fotografía', 'Video', 'Música/DJ', 'Flores/Decoración',
  'Vestido', 'Traje', 'Pastel', 'Invitaciones', 'Transporte',
  'Iglesia/Civil', 'Salón/Venue', 'Maquillaje/Peinado', 'Joyería', 'Otro'
];

const formatMXN = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount);

const statusColors: Record<Vendor['status'], string> = {
  pendiente: 'bg-stone-100 text-stone-600',
  apartado: 'bg-amber-100 text-amber-700',
  pagado_parcial: 'bg-blue-100 text-blue-700',
  pagado_total: 'bg-emerald-100 text-emerald-700',
};

const statusLabels: Record<Vendor['status'], string> = {
  pendiente: 'Sin pago',
  apartado: 'Apartado',
  pagado_parcial: 'Parcial',
  pagado_total: 'Liquidado',
};

export default function Proveedores({ store }: { store: ReturnType<typeof useStore> }) {
  const { vendors, addVendor, updateVendor, deleteVendor, addPayment, stats } = store;
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');

  const filtered = filterCat === 'all' ? vendors : vendors.filter(v => v.categoria === filterCat);

  const openAdd = () => { setEditingVendor(null); setShowModal(true); };
  const openEdit = (v: Vendor) => { setEditingVendor(v); setShowModal(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-800">Proveedores</h2>
          <p className="text-stone-400 text-sm">{vendors.filter(v => v.contratado).length} contratados · {vendors.length} registrados</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
        >
          <Plus size={18} /> Agregar
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCat('all')}
          className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            filterCat === 'all' ? 'bg-rose-500 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:border-rose-300'
          )}
        >
          Todos
        </button>
        {CATEGORIES.filter(c => vendors.some(v => v.categoria === c)).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filterCat === cat ? 'bg-rose-500 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:border-rose-300'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Vendor grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <div className="text-5xl mb-4">🎊</div>
          <p className="text-lg font-medium">Aún no hay proveedores</p>
          <p className="text-sm">Agrega tu primer proveedor para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(vendor => {
            const pagado = vendor.pagos.reduce((s, p) => s + p.monto, 0);
            const costoReal = vendor.costoPorPersona ? vendor.costoTotal * stats.totalInvitados : vendor.costoTotal;
            const porcentaje = costoReal > 0 ? Math.min(100, (pagado / costoReal) * 100) : 0;

            return (
              <div key={vendor.id} className={clsx(
                'bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow',
                vendor.contratado ? 'border-emerald-200' : 'border-stone-200'
              )}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-800 truncate">{vendor.nombre}</h3>
                      {vendor.contratado && <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />}
                    </div>
                    <span className="text-xs text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">{vendor.categoria}</span>
                  </div>
                  <span className={clsx('text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ml-2', statusColors[vendor.status])}>
                    {statusLabels[vendor.status]}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-stone-500">
                      {vendor.costoPorPersona ? `${formatMXN(vendor.costoTotal)}/persona` : formatMXN(costoReal)}
                    </span>
                    <span className="font-medium text-stone-700">{formatMXN(pagado)} pagado</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>

                {vendor.contacto && (
                  <p className="text-xs text-stone-400 mb-3 truncate">👤 {vendor.contacto}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedVendor(vendor); setShowPaymentModal(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <DollarSign size={14} /> Pago
                  </button>
                  <button
                    onClick={() => openEdit(vendor)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Edit size={14} /> Editar
                  </button>
                  <button
                    onClick={() => { if (confirm('¿Eliminar este proveedor?')) deleteVendor(vendor.id); }}
                    className="bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <VendorModal
          vendor={editingVendor}
          onSave={(data) => {
            if (editingVendor) {
              updateVendor(editingVendor.id, data);
            } else {
              addVendor(data as Omit<Vendor, 'id' | 'fechaCreacion' | 'pagos' | 'status'>);
            }
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      {showPaymentModal && selectedVendor && (
        <PaymentModal
          vendor={selectedVendor}
          totalInvitados={stats.totalInvitados}
          onSave={(payment) => {
            addPayment(selectedVendor.id, payment);
            setShowPaymentModal(false);
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}

function VendorModal({ vendor, onSave, onClose }: {
  vendor: Vendor | null;
  onSave: (data: Partial<Vendor>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    nombre: vendor?.nombre || '',
    categoria: vendor?.categoria || 'Otro' as VendorCategory,
    contacto: vendor?.contacto || '',
    telefono: vendor?.telefono || '',
    email: vendor?.email || '',
    costoTotal: vendor?.costoTotal?.toString() || '',
    costoPorPersona: vendor?.costoPorPersona || false,
    contratado: vendor?.contratado || false,
    notas: vendor?.notas || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      costoTotal: parseFloat(form.costoTotal) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="font-serif text-xl font-bold mb-5">{vendor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">Nombre *</label>
              <input
                required
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="Ej. Banquetes La Hacienda"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Categoría *</label>
              <select
                value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value as VendorCategory }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Costo (MXN)</label>
              <input
                type="number"
                value={form.costoTotal}
                onChange={e => setForm(f => ({ ...f, costoTotal: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="0"
              />
            </div>
            <div className="col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.costoPorPersona}
                  onChange={e => setForm(f => ({ ...f, costoPorPersona: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-stone-600">Precio por persona</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.contratado}
                  onChange={e => setForm(f => ({ ...f, contratado: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-stone-600">Contratado ✓</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Contacto</label>
              <input
                value={form.contacto}
                onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
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
            <div className="col-span-2">
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
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl font-medium hover:bg-stone-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl font-medium transition-colors">
              {vendor ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({ vendor, totalInvitados, onSave, onClose }: {
  vendor: Vendor;
  totalInvitados: number;
  onSave: (payment: Omit<Payment, 'id'>) => void;
  onClose: () => void;
}) {
  const costoReal = vendor.costoPorPersona ? vendor.costoTotal * totalInvitados : vendor.costoTotal;
  const totalPagado = vendor.pagos.reduce((s, p) => s + p.monto, 0);
  const pendiente = costoReal - totalPagado;

  const [form, setForm] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    concepto: 'apartado',
    notas: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, monto: parseFloat(form.monto) || 0 });
  };

  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="font-serif text-xl font-bold mb-2">Registrar Pago</h3>
        <p className="text-stone-500 text-sm mb-5">{vendor.nombre}</p>

        {/* Payment summary */}
        <div className="bg-stone-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Total:</span>
            <span className="font-medium">{fmt(costoReal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Pagado:</span>
            <span className="font-medium text-emerald-600">{fmt(totalPagado)}</span>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2">
            <span className="text-stone-500">Pendiente:</span>
            <span className="font-bold text-rose-500">{fmt(pendiente)}</span>
          </div>
        </div>

        {/* Historial */}
        {vendor.pagos.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-stone-500 mb-2">Historial de pagos</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {vendor.pagos.map(p => (
                <div key={p.id} className="flex justify-between text-xs bg-emerald-50 rounded-lg px-3 py-1.5">
                  <span className="text-stone-600">{p.concepto} · {new Date(p.fecha).toLocaleDateString('es-MX')}</span>
                  <span className="font-medium text-emerald-700">{fmt(p.monto)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Monto *</label>
              <input
                required
                type="number"
                value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Concepto</label>
            <select
              value={form.concepto}
              onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              <option value="apartado">Apartado</option>
              <option value="anticipo">Anticipo</option>
              <option value="segunda_exhibicion">2a Exhibición</option>
              <option value="liquidacion">Liquidación final</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl font-medium hover:bg-stone-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-medium transition-colors">
              Registrar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
