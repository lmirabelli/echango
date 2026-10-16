import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-realizar-compras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './realizar-compras.html',
  styleUrls: ['./realizar-compras.css']
})
export class RealizarCompras implements OnInit, AfterViewInit, OnDestroy {
  private supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private scanner: Html5QrcodeScanner | null = null;

  // Estados
  listas = signal<any[]>([]);
  listaSeleccionadaId = signal<number | null>(null);
  productosDeLista = signal<any[]>([]);
  
  loadingListas = signal(false);
  loadingProductos = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Producto actual detectado listo para cobrar/ingresar al chango
  productoActual = signal<any | null>(null);

  // Formulario principal de la compra en curso (Supermercado + Cantidad + Precio)
  compraForm: FormGroup = this.fb.group({
    supermercado: ['', [Validators.required]],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    precio: [0, [Validators.required, Validators.min(0)]]
  });

  async ngOnInit() {
    await this.cargarListas();
  }

  ngAfterViewInit() {
    // Inicializamos el escáner continuo para el chango
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

  async cargarListas() {
    try {
      this.loadingListas.set(true);
      const data = await this.supabaseService.obtenerListasCompras();
      this.listas.set(data);
      if (data.length > 0) {
        this.seleccionarLista(data[0].id);
      }
    } catch (err) {
      this.errorMessage.set('Error al cargar las listas de compras.');
    } finally {
      this.loadingListas.set(false);
    }
  }

  async seleccionarLista(listaId: number) {
    this.listaSeleccionadaId.set(listaId);
    try {
      this.loadingProductos.set(true);
      const productos = await this.supabaseService.obtenerProductosDeLista(listaId);
      this.productosDeLista.set(productos);
    } catch (err) {
      this.errorMessage.set('Error al cargar los productos de la lista guía.');
    } finally {
      this.loadingProductos.set(false);
    }
  }

  onCambiarLista(event: any) {
    const id = Number(event.target.value);
    if (id) {
      this.seleccionarLista(id);
    }
  }

  async onScanSuccess(codigoEscaneado: string) {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      // Buscamos si el producto existe en la base de datos general
      const productoBD = await this.supabaseService.buscarProductoPorCodigo(codigoEscaneado);

      if (productoBD) {
        // ¡Existe! Lo cargamos en el panel de producto actual para poner precio y cantidad
        this.productoActual.set({
          producto: productoBD.producto,
          marca: productoBD.marca,
          medida: productoBD.medida,
          codigo_barra: codigoEscaneado
        });
      } else {
        // No existe: redirigir a agregar-producto pasándole el returnUrl a este componente
        this.router.navigate(['/agregar-producto'], { 
          queryParams: { 
            codigo: codigoEscaneado, 
            returnUrl: '/realizar-compras' 
          } 
        });
      }
    } catch (err) {
      this.errorMessage.set('Error al procesar el código de barras.');
    }
  }

  async confirmarItemAlChango() {
    if (this.compraForm.invalid || !this.productoActual()) return;

    const formValues = this.compraForm.value;
    const prod = this.productoActual();

    if (!formValues.supermercado) {
      this.errorMessage.set('Por favor, ingresá el nombre del supermercado antes de registrar ítems.');
      return;
    }

    try {
      await this.supabaseService.registrarCompra({
        producto: prod.producto,
        marca: prod.marca || null,
        codigo_barra: prod.codigo_barra || null,
        cantidad: Number(formValues.cantidad),
        precio: Number(formValues.precio),
        supermercado: formValues.supermercado
      });

      this.successMessage.set(`¡${prod.producto} agregado al chango con éxito!`);
      
      // Limpiamos el producto actual para seguir escaneando el siguiente
      this.productoActual.set(null);
      this.compraForm.patchValue({ cantidad: 1, precio: 0 });

      setTimeout(() => this.successMessage.set(null), 2500);
    } catch (err) {
      this.errorMessage.set('Error al registrar la compra en la base de datos.');
    }
  }

  ngOnDestroy() {
    this.scanner?.clear().catch(error => console.error("Error al limpiar el escáner", error));
  }
}