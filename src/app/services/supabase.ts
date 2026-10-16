import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { from, switchMap } from 'rxjs';
import { RegisterData, UserProfile } from '../models/user';
import { ItemChango } from '../models/compra';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    // Getter para acceder al cliente desde cualquier componente o servicio
    get client(): SupabaseClient {
        return this.supabase;
    }

    // --- Helpers de Autenticación Rápida ---

    signIn(email: string, password: string) {
        return from(this.supabase.auth.signInWithPassword({ email, password }));
    }

    signUp(formData: RegisterData) {
        return from(
            this.supabase.auth.signUp({ email: formData.email, password: formData.password })
        ).pipe(
            switchMap(async ({ data, error }) => {
                if (error) throw error;
                if (data.user) {
                    // Construimos el objeto respetando la interfaz UserProfile
                    const profilePayload: UserProfile = {
                        auth_id: data.user.id,
                        nombre: formData.nombre,
                        apellido: formData.apellido,
                        email: formData.email,
                        ciudad: formData.ciudad,
                        username: formData.user,
                        role: 'user'
                    };

                    const { error: profileError } = await this.supabase
                        .from('profiles')
                        .insert(profilePayload);

                    if (profileError) throw profileError;
                }
                return { data, error: null };
            })
        );
    }

    signOut() {
        return from(this.supabase.auth.signOut());
    }

    async getProfile() {
        const user = await this.getCurrentUser();
        if (!user) return null;
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('auth_id', user.id)
            .single();

        if (error) return null;
        return data;
    }

    // Obtener sesión actual de forma síncrona/promesa
    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }

    async buscarProductoPorCodigo(codigo: string) {
        const { data, error } = await this.supabase
            .from('productos')
            .select('*')
            .eq('codigo', codigo)
            .maybeSingle(); // Retorna el registro o null si no existe sin tirar error 406

        if (error) throw error;
        return data;
    }

    // Insertar nuevo producto
    async insertarProducto(producto: any) {
        const { data, error } = await this.supabase
            .from('productos')
            .insert([producto])
            .select();
        if (error) throw error;
        return data;
    }

    // Actualizar producto existente por código
    async actualizarProducto(codigo: string, productoActualizado: any) {
        const { data, error } = await this.supabase
            .from('productos')
            .update(productoActualizado)
            .eq('codigo', codigo)
            .select();
        if (error) throw error;
        return data;
    }

    // Obtener todas las listas del usuario actual
    async obtenerListasCompras() {
        const user = await this.getCurrentUser();
        if (!user) return [];

        const { data, error } = await this.supabase
            .from('lista_compras')
            .select('*')
            .eq('usuario', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    // Crear una nueva lista de compras
    async crearListaCompra(nombreLista: string) {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data, error } = await this.supabase
            .from('lista_compras')
            .insert([{ nombre_lista: nombreLista, usuario: user.id }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Obtener los productos de una lista específica
    async obtenerProductosDeLista(listaId: number) {
        const { data, error } = await this.supabase
            .from('productos_lista')
            .select('*')
            .eq('lista', listaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async agregarProductoALista(item: {
        lista: number;
        cantidad: number;
        codigo_barras?: string;
        producto: string;
        marca?: string;
        medida?: string;
    }) {
        const { data, error } = await this.supabase
            .from('productos_lista')
            .insert([item])
            .select();

        if (error) throw error;
        return data;
    }

    // Marcar producto como comprado / pendiente
async actualizarEstadoProducto(productoListaId: number, comprado: boolean) {
  const { error } = await this.supabase
    .from('productos_lista')
    .update({ comprado })
    .eq('id', productoListaId);

  if (error) throw error;
}

// Eliminar un producto de la lista
async eliminarProductoDeLista(productoListaId: number) {
  const { error } = await this.supabase
    .from('productos_lista')
    .delete()
    .eq('id', productoListaId);

  if (error) throw error;
}

// Eliminar una lista completa de compras
async eliminarListaCompra(listaId: number) {
  const { error } = await this.supabase
    .from('lista_compras')
    .delete()
    .eq('id', listaId);

  if (error) throw error;
}
// Registrar una compra en la tabla compras
async registrarCompra(compra: ItemChango) {
  const user = await this.getCurrentUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await this.supabase
    .from('en_chango')
    .insert([{ ...compra, usuario: user.id }])
    .select();

  if (error) throw error;
  return data;
}

async obtenerComprasPorSupermercado(supermercado: string): Promise<ItemChango[]> {
  const { data, error } = await this.supabase
    .from('en_chango')
    .select('*');

  if (error) throw error;
  return data || [];
}

// Eliminar un ítem del chango por su ID
async eliminarItemChango(itemId: number) {
  const { error } = await this.supabase
    .from('en_chango')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

}