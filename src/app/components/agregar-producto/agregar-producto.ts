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
  
  // Variables para almacenar de dónde vino (origen de lista o de compras en curso)
  private origenListaId: string | null = null;
  private returnUrl: string | null = null;

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
      // Capturamos el listaId o la URL de retorno si vienen en los queryParams
      this.origenListaId = params['listaId'] || null;
      this.returnUrl = params['returnUrl'] || null;

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
        await this.supabaseService.actualizarProducto(formValues.codigo, formValues);
        this.successMessage.set('¡Producto actualizado exitosamente!');
      } else {
        await this.supabaseService.insertarProducto(formValues);
        this.successMessage.set('¡Producto agregado exitosamente!');
      }

      // Redirección inteligente al finalizar según el origen
      setTimeout(() => {
        if (this.returnUrl) {
          // Si vino desde el módulo de realización de compras en vivo
          this.router.navigate([this.returnUrl]);
        } else if (this.origenListaId) {
          // Si vino desde una lista específica de compras
          this.router.navigate(['/agregar-producto-lista', this.origenListaId]);
        } else {
          // Por defecto, vuelve al buscador de productos
          this.router.navigate(['/buscar-producto']);
        }
      }, 1500);

    } catch (err: any) {
      this.errorMessage.set(err.message || 'Ocurrió un error al guardar el producto.');
    } finally {
      this.loading.set(false);
    }
  }
}