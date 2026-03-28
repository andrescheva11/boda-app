import { useState, useEffect } from 'react';
import { Vendor, Guest, WeddingConfig, Payment } from '../types';

const STORAGE_KEYS = {
  vendors: 'boda_vendors',
  guests: 'boda_guests',
  config: 'boda_config',
};

const defaultConfig: WeddingConfig = {
  nombreNovia: 'Novia',
  nombreNovio: 'Novio',
  fecha: '2026-12-31',
  venue: '',
  presupuestoTotal: 300000,
  invitadosEstimados: 150,
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function useStore() {
  const [vendors, setVendors] = useState<Vendor[]>(() => loadFromStorage(STORAGE_KEYS.vendors, []));
  const [guests, setGuests] = useState<Guest[]>(() => loadFromStorage(STORAGE_KEYS.guests, []));
  const [config, setConfig] = useState<WeddingConfig>(() => loadFromStorage(STORAGE_KEYS.config, defaultConfig));

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.vendors, JSON.stringify(vendors)); }, [vendors]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.guests, JSON.stringify(guests)); }, [guests]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config)); }, [config]);

  // Vendor actions
  const addVendor = (vendor: Omit<Vendor, 'id' | 'fechaCreacion' | 'pagos' | 'status'>) => {
    const newVendor: Vendor = {
      ...vendor,
      id: crypto.randomUUID(),
      fechaCreacion: new Date().toISOString(),
      pagos: [],
      status: 'pendiente',
    };
    setVendors(prev => [...prev, newVendor]);
    return newVendor;
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVendor = (id: string) => {
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  const addPayment = (vendorId: string, payment: Omit<Payment, 'id'>) => {
    const newPayment: Payment = { ...payment, id: crypto.randomUUID() };
    setVendors(prev => prev.map(v => {
      if (v.id !== vendorId) return v;
      const pagos = [...v.pagos, newPayment];
      const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
      const totalGuests = guests.reduce((s, g) => s + g.pases, 0);
      const costoReal = v.costoPorPersona ? v.costoTotal * (totalGuests > 0 ? totalGuests : 1) : v.costoTotal;
      const status: Vendor['status'] = totalPagado === 0 ? 'pendiente' : totalPagado >= costoReal ? 'pagado_total' : 'pagado_parcial';
      return { ...v, pagos, status };
    }));
  };

  // Guest actions
  const addGuest = (guest: Omit<Guest, 'id' | 'fechaCreacion'>) => {
    const newGuest: Guest = {
      ...guest,
      id: crypto.randomUUID(),
      fechaCreacion: new Date().toISOString(),
    };
    setGuests(prev => [...prev, newGuest]);
    return newGuest;
  };

  const updateGuest = (id: string, updates: Partial<Guest>) => {
    setGuests(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGuest = (id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
  };

  const updateConfig = (updates: Partial<WeddingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Computed stats
  const totalInvitados = guests.reduce((sum, g) => sum + g.pases, 0);
  const confirmados = guests.filter(g => g.status === 'confirmado').reduce((sum, g) => sum + g.pases, 0);
  const declinados = guests.filter(g => g.status === 'declinado').reduce((sum, g) => sum + g.pases, 0);

  const totalCosto = vendors.filter(v => v.contratado).reduce((sum, v) => {
    const costo = v.costoPorPersona ? v.costoTotal * totalInvitados : v.costoTotal;
    return sum + costo;
  }, 0);

  const totalPagado = vendors.reduce((sum, v) => {
    return sum + v.pagos.reduce((s, p) => s + p.monto, 0);
  }, 0);

  const totalPendiente = totalCosto - totalPagado;

  return {
    vendors, guests, config,
    addVendor, updateVendor, deleteVendor, addPayment,
    addGuest, updateGuest, deleteGuest,
    updateConfig,
    stats: {
      totalInvitados,
      confirmados,
      declinados,
      pendientesRespuesta: totalInvitados - confirmados - declinados,
      totalCosto,
      totalPagado,
      totalPendiente,
      porcentajePagado: totalCosto > 0 ? (totalPagado / totalCosto) * 100 : 0,
      costoPorPersona: totalInvitados > 0 ? totalCosto / totalInvitados : 0,
    }
  };
}
