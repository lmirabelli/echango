export interface ItemChango {
  id?: number;
  usuario?: string;
  producto: string;
  marca?: string | null;
  codigo_barra?: string | null;
  cantidad: number;
  precio: number;
  supermercado: string;
  created_at?: string;
}

export interface ListaCompra {
  id: number;
  usuario: string;
  nombre_lista: string;
  created_at: string;
}