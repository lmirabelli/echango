import { Component, AfterViewInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-agregar-producto-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './agregar-producto-lista.html',
  styleUrls: ['./agregar-producto-lista.css']
})
export class AgregarProductoLista implements AfterViewInit, OnDestroy {
  private supabaseService = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  private scanner: Html5QrcodeScanner | null = null;
  listaId!: number;

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  productoDetectadoMsg = signal<string | null>(null);

  itemForm: FormGroup = this.fb.group({
    producto: ['', [Validators.required]],
    marca: [''],
    medida: [''],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    codigo_barras: ['']
  });

  ngAfterViewInit() {
    this.listaId = Number(this.route.snapshot.paramMap.get('listaId'));

    // Inicializamos el escáner de barras
    this.scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 100 } },
      false
    );

    this.scanner.render(
      (decodedText) => this.onScanSuccess(decodedText),
      (errorMessage) => {}
    );
  }

  async onScanSuccess(codigoEscaneado: string) {
    this.errorMessage.set(null);
    this.productoDetectadoMsg.set(null);

    try {
      // 1. Buscamos si el producto ya existe en la tabla general de productos
      const productoBD = await this.supabaseService.buscarProductoPorCodigo(codigoEscaneado);

      if (productoBD) {
        // Si existe, autocompletamos el formulario con sus datos
        this.itemForm.patchValue({
          producto: productoBD.producto,
          marca: productoBD.marca || '',
          medida: productoBD.medida || '',
          codigo_barras: codigoEscaneado
        });
        this.productoDetectadoMsg.set(`¡Producto reconocido: ${productoBD.producto}! Ajustá la cantidad y guardá.`);
      } else {
        // Si no está en la BD, dejamos el código listo para cargarlo manualmente
        this.itemForm.patchValue({
          codigo_barras: codigoEscaneado
        });
        this.productoDetectadoMsg.set(`Código nuevo (${codigoEscaneado}). Completá los datos y agregalo.`);
      }
    } catch (err) {
      this.errorMessage.set('Error al consultar el código de barras.');
    }
  }

  async onSubmit() {
    if (this.itemForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValues = this.itemForm.value;

    try {
      await this.supabaseService.agregarProductoALista({
        lista: this.listaId,
        cantidad: Number(formValues.cantidad),
        codigo_barras: formValues.codigo_barras || null,
        producto: formValues.producto,
        marca: formValues.marca || null,
        medida: formValues.medida || null
      });

      this.successMessage.set('¡Producto agregado a la lista exitosamente!');
      this.itemForm.reset({ cantidad: 1 });
      
      setTimeout(() => {
        this.successMessage.set(null);
        this.productoDetectadoMsg.set(null);
      }, 2000);

    } catch (err: any) {
      this.errorMessage.set('Error al guardar el producto en la lista.');
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    this.scanner?.clear().catch(error => console.error("Error al limpiar escáner", error));
  }
}