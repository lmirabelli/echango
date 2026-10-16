import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal, computed } from '@angular/core';
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

  private scanner: Html5QrcodeScanner | null = null;

  // Estados
  listas = signal<any[]>([]);
  listaSeleccionadaId = signal<number | null>(null);
  productosDeLista = signal<any[]>([]);
  
  // Productos cargados físicamente en el chango durante esta sesión de compra
  productosEnChango = signal<any[]>([]);

  loadingListas = signal(false);
  loadingProductos = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Producto actual detectado por el escáner listo para cargar cantidad y precio
  productoActual = signal<any | null>(null);

  // Formulario de configuración (Supermercado) y detalle del producto escaneado
  compraForm: FormGroup = this.fb.group({
    supermercado: ['', [Validators.required]],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    precio: [0, [Validators.required, Validators.min(0)]]
  });

  // Total acumulado en el chango computado automáticamente
  totalChango = computed(() => {
    return this.productosEnChango().reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  });

  async ngOnInit() {
    await this.cargarListas();
  }

  async ngAfterViewInit() {
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

  // Marcar/Desmarcar producto de la lista guía al clickearlo
  async toggleEstadoGuia(item: any) {
    try {
      const nuevoEstado = !item.comprado;
      await this.supabaseService.actualizarEstadoProducto(item.id, nuevoEstado);

      // Actualizar señal localmente
      this.productosDeLista.update(productos =>
        productos.map(p => p.id === item.id ? { ...p, comprado: nuevoEstado } : p)
      );
    } catch (err) {
      this.errorMessage.set('Error al actualizar el estado en la guía.');
    }
  }

  async onScanSuccess(codigoEscaneado: string) {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const productoBD = await this.supabaseService.buscarProductoPorCodigo(codigoEscaneado);

      if (productoBD) {
        this.productoActual.set({
          producto: productoBD.producto,
          marca: productoBD.marca,
          medida: productoBD.medida,
          codigo_barra: codigoEscaneado
        });
      } else {
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

    const supermercadoActual = formValues.supermercado;
    if (!supermercadoActual) {
      this.errorMessage.set('Por favor, ingresá el nombre del supermercado.');
      return;
    }

    const itemCompra = {
      producto: prod.producto,
      marca: prod.marca || null,
      codigo_barra: prod.codigo_barra || null,
      cantidad: Number(formValues.cantidad),
      precio: Number(formValues.precio),
      supermercado: supermercadoActual
    };

    try {
      // 1. Guardamos físicamente en la tabla 'compras' de Supabase
      await this.supabaseService.registrarCompra(itemCompra);

      // 2. Volvemos a consultar el chango desde la base de datos para mantener sincronizado
      await this.cargarProductosDelChango(supermercadoActual);

      this.successMessage.set(`¡${prod.producto} agregado al chango!`);
      
      // Limpiar producto actual y resetear cantidad/precio para el próximo escaneo
      this.productoActual.set(null);
      this.compraForm.patchValue({ cantidad: 1, precio: 0 });

      setTimeout(() => this.successMessage.set(null), 2000);
    } catch (err) {
      this.errorMessage.set('Error al registrar la compra en la base de datos.');
    }
  }

  async cargarProductosDelChango(supermercado: string) {
  try {
    const data = await this.supabaseService.obtenerComprasPorSupermercado(supermercado);
    if (data) {
      this.productosEnChango.set(data);
    }
  } catch (err) {
    console.error('Error al cargar productos del chango', err);
    this.errorMessage.set('Error al sincronizar los productos del chango.');
  }
}

onSupermercadoChange() {
    const supermercado = this.compraForm.get('supermercado')?.value;
    if (supermercado) {
      this.cargarProductosDelChango(supermercado);
    }
  }

  // Eliminar un producto del chango actual
  async eliminarItemDelChango(itemId: number) {
    try {
      await this.supabaseService.eliminarItemChango(itemId);
      
      // Actualizamos la señal localmente filtrando el ítem borrado
      this.productosEnChango.update(productos => productos.filter(p => p.id !== itemId));
    } catch (err) {
      this.errorMessage.set('Error al eliminar el producto del chango.');
    }
  }

  // Botón Compra Realizada (por el momento sin acción compleja)
  finalizarCompra() {
    alert('¡Compra registrada con éxito!');
  }

  ngOnDestroy() {
    this.scanner?.clear().catch(error => console.error("Error al limpiar escáner", error));
  }
}