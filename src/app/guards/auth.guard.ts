import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { from, map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const supabaseService = inject(SupabaseService);
    const router = inject(Router);

    // Verificamos si existe una sesión activa en Supabase
    return from(supabaseService.client.auth.getSession()).pipe(
        map(({ data }) => {
            if (data.session) {
                return true; // Usuario logueado, acceso permitido
            } else {
                // Usuario NO logueado, redirigir al login
                return router.createUrlTree(['/iniciar-sesion']);
            }
        }),
        catchError(() => of(router.createUrlTree(['/iniciar-sesion'])))
    );
};