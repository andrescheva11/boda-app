import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Vendor, Payment } from '../types';
import { Save, Download, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const formatMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

function buildSeedVendors(): Vendor[] {
  const now = new Date().toISOString();
  const mkPayment = (monto: number, concepto: string, notas?: string, fecha?: string): Payment => ({
    id: crypto.randomUUID(),
    monto,
    fecha: fecha ?? now,
    concepto,
    notas,
  });

  const calcStatus = (pagos: Payment[], costoTotal: number): Vendor['status'] => {
    const totalPagado = pagos.reduce((s, p) => s + p.monto, 0);
    if (totalPagado === 0) return 'pendiente';
    if (totalPagado >= costoTotal) return 'pagado_total';
    return 'pagado_parcial';
  };

  const rows: Omit<Vendor, 'id' | 'fechaCreacion' | 'status'>[] = [
    {
      nombre: 'Banquete HK',
      categoria: 'Banquetero',
      contacto: 'HK',
      notas: '250 personas × $980/persona',
      costoTotal: 245000,
      costoPorPersona: false,
      pagos: [],
      contratado: true,
    },
    {
      nombre: 'Wedding Planner',
      categoria: 'Otro',
      contacto: 'Lizette Guerra',
      costoTotal: 35000,
      costoPorPersona: false,
      pagos: [mkPayment(5000, 'Apartado', 'Pagó Maria')],
      contratado: true,
    },
    {
      nombre: 'Alcohol',
      categoria: 'Otro',
      costoTotal: 50000,
      costoPorPersona: false,
      pagos: [],
      contratado: false,
    },
    {
      nombre: 'Coronitas y Pacíficos',
      categoria: 'Otro',
      notas: '200 botellas × $12.50',
      costoTotal: 2500,
      costoPorPersona: false,
      pagos: [],
      contratado: false,
    },
    {
      nombre: 'Florista',
      categoria: 'Flores/Decoración',
      costoTotal: 60000,
      costoPorPersona: false,
      pagos: [],
      contratado: false,
    },
    {
      nombre: 'Techo',
      categoria: 'Otro',
      costoTotal: 20000,
      costoPorPersona: false,
      pagos: [],
      contratado: false,
    },
    {
      nombre: 'Valet Parking',
      categoria: 'Transporte',
      costoTotal: 6100,
      costoPorPersona: false,
      pagos: [],
      contratado: false,
    },
    {
      nombre: 'Invitaciones',
      categoria: 'Invitaciones',
      costoTotal: 0,
      costoPorPersona: false,
      pagos: [],
      contratado: false,
    },
    {
      nombre: 'Fotografía y Video',
      categoria: 'Fotografía',
      contacto: 'Mike (SAGU)',
      costoTotal: 40000,
      costoPorPersona: false,
      pagos: [],
      contratado: true,
    },
    {
      nombre: 'Lunch Boxes',
      categoria: 'Otro',
      notas: '20 lunch boxes × $50',
      costoTotal: 1000,
      costoPorPersona: false,
      pagos: [],
      contratado: false,
    },
    {
      nombre: 'Finca / Venue',
      categoria: 'Salón/Venue',
      costoTotal: 62500,
      costoPorPersona: false,
      pagos: [
        mkPayment(20000, 'Apartado 1/3', 'Pagó Martha'),
        mkPayment(21500, 'Apartado 2/3', 'Pagó Andres'),
        mkPayment(21000, 'Apartado 3/3', 'Pagó Carla y Pablo'),
      ],
      contratado: true,
    },
    {
      nombre: 'Zap',
      categoria: 'Otro',
      costoTotal: 10000,
      costoPorPersona: false,
      pagos: [mkPayment(10000, 'Apartado', 'Pagó Andres', '2026-03-19T00:00:00.000Z')],
      contratado: true,
    },
  ];

  return rows.map(row => ({
    ...row,
    id: crypto.randomUUID(),
    fechaCreacion: now,
    status: calcStatus(row.pagos, row.costoTotal),
  }));
}

const SEED_PREVIEW = [
  { nombre: 'Banquete HK', costoTotal: 245000 },
  { nombre: 'Wedding Planner', costoTotal: 35000 },
  { nombre: 'Alcohol', costoTotal: 50000 },
  { nombre: 'Florista', costoTotal: 60000 },
  { nombre: 'Finca / Venue', costoTotal: 62500 },
  { nombre: 'Fotografía y Video', costoTotal: 40000 },
  { nombre: 'Techo', costoTotal: 20000 },
  { nombre: 'Valet Parking', costoTotal: 6100 },
  { nombre: '+ 4 más…', costoTotal: 4500 },
];

function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export default function Configuracion({ store }: { store: ReturnType<typeof useStore> }) {
  const { config, updateConfig, stats, vendors, importVendors } = store;
  const [form, setForm] = useState({ ...config });
  const [saved, setSaved] = useState(false);
  const [imported, setImported] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Google Sheets sync state
  const [sheetUrl, setSheetUrl] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      ...form,
      presupuestoTotal: parseFloat(form.presupuestoTotal.toString()) || 0,
      invitadosEstimados: parseInt(form.invitadosEstimados.toString()) || 0,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImport = () => {
    if (vendors.length > 0 && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    importVendors(buildSeedVendors());
    setImported(true);
    setShowConfirm(false);
    setTimeout(() => setImported(false), 3000);
  };

  const handleSheetSync = async () => {
    const id = extractSheetId(sheetUrl);
    if (!id) {
      setSyncMsg({ type: 'err', text: 'URL no válida. Pega el link completo de Google Sheets.' });
      return;
    }
    setSyncing(true);
    setSyncMsg(null);
    try {
      // Requires the sheet to be published: Archivo > Compartir > Publicar en la web > CSV
      const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=1413443292`;
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const rows = text.trim().split('\n').slice(1); // skip header
      const parsed: Vendor[] = rows
        .map(row => {
          const cols = row.split(',').map(c => c.replace(/^"|"$/g, '').trim());
          const concepto = cols[0];
          const costoTotal = parseFloat(cols[2]?.replace(/[$,]/g, '') || '0') || 0;
          if (!concepto) return null;
          return {
            id: crypto.randomUUID(),
            nombre: concepto,
            categoria: 'Otro' as const,
            contacto: cols[5] || undefined,
            costoTotal,
            costoPorPersona: false,
            pagos: [],
            status: 'pendiente' as const,
            contratado: costoTotal > 0,
            fechaCreacion: new Date().toISOString(),
          };
        })
        .filter((v): v is Vendor => v !== null && v.nombre !== '');

      if (parsed.length === 0) throw new Error('No se encontraron filas en el sheet.');
      importVendors(parsed);
      setSyncMsg({ type: 'ok', text: `✓ ${parsed.length} proveedores sincronizados desde Google Sheets` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncMsg({
        type: 'err',
        text: `No se pudo conectar. Asegúrate de publicar el sheet: Archivo → Compartir → Publicar en la web → CSV. (${msg})`,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h2 className="font-serif text-2xl font-bold text-stone-800">Configuración</h2>
        <p className="text-stone-400 text-sm">Datos generales de tu boda</p>
      </div>

      {/* General settings form */}
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

      {/* ── Import from Google Sheets ── */}
      <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm space-y-5">
        <div>
          <h3 className="font-serif text-lg font-semibold text-stone-800">Importar datos del Sheet</h3>
          <p className="text-stone-400 text-sm mt-0.5">
            Carga los proveedores y gastos de tu hoja "Nuestras cuentas con HK"
          </p>
        </div>

        {/* Preview list */}
        <div className="bg-stone-50 rounded-xl p-4 divide-y divide-stone-100">
          {SEED_PREVIEW.map(row => (
            <div key={row.nombre} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-stone-600">{row.nombre}</span>
              <span className="font-medium text-stone-800">{formatMXN(row.costoTotal)}</span>
            </div>
          ))}
        </div>

        {/* Warning if vendors already exist */}
        {vendors.length > 0 && !imported && (
          <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              Ya tienes <strong>{vendors.length}</strong> proveedores guardados. Si importas, se <strong>reemplazarán</strong> con los datos del sheet.
            </span>
          </div>
        )}

        {showConfirm && (
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Sí, reemplazar todo
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {!showConfirm && (
          <button
            onClick={handleImport}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Download size={16} />
            {vendors.length > 0 ? 'Reemplazar con datos del Sheet' : 'Cargar 12 proveedores del Sheet'}
          </button>
        )}

        {imported && (
          <div className="flex items-center gap-2 text-emerald-700 text-sm">
            <CheckCircle size={16} />
            ¡Listo! Los proveedores ya están en la app. Puedes editarlos en la sección de Gastos.
          </div>
        )}

        {/* ── Live sync from URL ── */}
        <div className="border-t border-stone-100 pt-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Sincronización en vivo (opcional)</p>
          <p className="text-stone-500 text-xs mb-3">
            Pega el link de tu Google Sheet para sincronizar automáticamente. Requiere que el sheet esté publicado:
            <strong> Archivo → Compartir → Publicar en la web → CSV</strong>
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            <button
              onClick={handleSheetSync}
              disabled={syncing || !sheetUrl}
              className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Leyendo…' : 'Sincronizar'}
            </button>
          </div>
          {syncMsg && (
            <p className={`text-xs mt-2 ${syncMsg.type === 'ok' ? 'text-emerald-600' : 'text-rose-500'}`}>
              {syncMsg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
