import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-agregar-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './agregar-producto.html',
  styleUrls: ['./agregar-producto.css']
})
export class AgregarProducto implements OnInit {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isEditMode = signal(false);

  productoForm: FormGroup = this.fb.group({
    producto: ['', [Validators.required]],
    marca: ['', [Validators.required]],
    medida: ['', [Validators.required]],
    rubro: ['', [Validators.required]],
    codigo: ['', [Validators.required]]
  });

  async ngOnInit() {
    this.route.queryParams.subscribe(async (params) => {
      const codigoParam = params['codigo'];
      if (codigoParam) {
        this.productoForm.patchValue({ codigo: codigoParam });
        await this.verificarSiExisteProducto(codigoParam);
      }
    });
  }

  async verificarSiExisteProducto(codigo: string) {
    try {
      this.loading.set(true);
      const productoExistente = await this.supabaseService.buscarProductoPorCodigo(codigo);
      
      if (productoExistente) {
        this.isEditMode.set(true);
        this.productoForm.patchValue({
          producto: productoExistente.producto,
          marca: productoExistente.marca,
          medida: productoExistente.medida,
          rubro: productoExistente.rubro,
          codigo: productoExistente.codigo
        });
      }
    } catch (err) {
      console.error('Error al verificar el producto', err);
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    if (this.productoForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValues = this.productoForm.value;

    try {
      if (this.isEditMode()) {
        // MODO ACTUALIZACIÓN
        await this.supabaseService.actualizarProducto(formValues.codigo, formValues);
        this.successMessage.set('¡Producto actualizado exitosamente!');
      } else {
        // MODO CREACIÓN (NUEVO)
        await this.supabaseService.insertarProducto(formValues);
        this.successMessage.set('¡Producto agregado exitosamente!');
      }
      setTimeout(() => {
        this.router.navigate(['/buscar-producto']);
      }, 1500);

    } catch (err: any) {
      this.errorMessage.set(err.message || 'Ocurrió un error al guardar el producto.');
    } finally {
      this.loading.set(false);
    }
  }
}