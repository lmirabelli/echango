import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { from, switchMap } from 'rxjs';
import { RegisterData, UserProfile } from '../models/user';

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

    // Obtener sesión actual de forma síncrona/promesa
    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }
}