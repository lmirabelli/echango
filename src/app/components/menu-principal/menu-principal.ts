import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu-principal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu-principal.html',
  styleUrls: ['./menu-principal.css']
})
export class MenuPrincipal implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  // Señal para almacenar el nombre del usuario
  username = signal<string>('Usuario');

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  async cargarDatosUsuario() {
    try {
      // Consultamos directamente la tabla profiles mediante el servicio
      const profile = await this.supabaseService.getProfile();
      if (profile && profile.username) { // O profile.username dependiendo de cómo nombraste la columna en tu BD
        this.username.set(profile.username);
      } else {
        this.username.set('Usuario');
      }
    } catch {
      this.username.set('Usuario');
    }
  }

  async cerrarSesion() {
    this.supabaseService.signOut().subscribe({
      next: () => {
        this.router.navigate(['/']);
      }
    });
  }
}