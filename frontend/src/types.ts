export type VendorCategory =
  | 'Banquetero'
  | 'Fotografía'
  | 'Video'
  | 'Música/DJ'
  | 'Flores/Decoración'
  | 'Vestido'
  | 'Traje'
  | 'Pastel'
  | 'Invitaciones'
  | 'Transporte'
  | 'Iglesia/Civil'
  | 'Salón/Venue'
  | 'Maquillaje/Peinado'
  | 'Joyería'
  | 'Otro';

export type PaymentStatus = 'pendiente' | 'apartado' | 'pagado_parcial' | 'pagado_total';
export type GuestPriority = 'A' | 'B' | 'C';
export type GuestStatus = 'pendiente' | 'confirmado' | 'declinado';

export interface Vendor {
  id: string;
  nombre: string;
  categoria: VendorCategory;
  contacto?: string;
  telefono?: string;
  email?: string;
  notas?: string;
  costoTotal: number;
  costoPorPersona?: boolean;
  pagos: Payment[];
  status: PaymentStatus;
  fechaCreacion: string;
  contratado: boolean;
}

export interface Payment {
  id: string;
  monto: number;
  fecha: string;
  concepto: string;
  notas?: string;
}

export interface Guest {
  id: string;
  nombre: string;
  apellido: string;
  pases: number;
  prioridad: GuestPriority;
  status: GuestStatus;
  telefono?: string;
  email?: string;
  mesa?: string;
  notas?: string;
  acompanante?: string;
  fechaCreacion: string;
}

export interface WeddingConfig {
  nombreNovia: string;
  nombreNovio: string;
  fecha: string;
  venue: string;
  presupuestoTotal: number;
  invitadosEstimados: number;
}
