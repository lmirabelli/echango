import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { RegisterData } from '../../models/user';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.html',
  styleUrls: ['./registro.scss']
})
export class RegisterFormComponent {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);

  goBack = output<void>();
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  registerForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    user: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    ciudad: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Tipamos explícitamente los valores del formulario con nuestra interfaz
    const formData: RegisterData = this.registerForm.value;

    this.supabaseService.signUp(formData).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('¡Registro exitoso! Ya puedes iniciar sesión.');
        this.registerForm.reset();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.message || 'Ocurrió un error al registrarse.');
      }
    });
  }
}