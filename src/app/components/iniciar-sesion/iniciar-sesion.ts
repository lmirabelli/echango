import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './iniciar-sesion.html',
  styleUrls: ['./iniciar-sesion.scss']
})
export class IniciarSesionComponent {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);

  goBack = output<void>();
  loginSuccess = output<void>(); // Evento cuando el login es exitoso

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.supabaseService.signIn(email, password).subscribe({
      next: ({ data, error }) => {
        this.loading.set(false);
        if (error) {
          this.errorMessage.set(error.message || 'Credenciales inválidas.');
          return;
        }
        // Éxito al iniciar sesión
        this.loginSuccess.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.message || 'Ocurrió un error al iniciar sesión.');
      }
    });
  }
}