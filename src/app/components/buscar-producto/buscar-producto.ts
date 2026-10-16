import { Component, AfterViewInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-buscar-producto',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './buscar-producto.html',
  styleUrls: ['./buscar-producto.css']
})
export class BuscarProducto implements AfterViewInit, OnDestroy {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  private scanner: Html5QrcodeScanner | null = null;

  productoEncontrado = signal<any | null>(null);
  errorMessage = signal<string | null>(null);
  buscando = signal(false);

  ngAfterViewInit() {
    // Inicializamos el escáner apuntando al div con id "reader"
    this.scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 100 } },
      false
    );

    this.scanner.render(
      (decodedText) => this.onScanSuccess(decodedText),
      (errorMessage) => {
        // Los errores de escaneo continuo por frame se pueden ignorar silenciosamente
      }
    );
  }

  async onScanSuccess(codigoEscaneado: string) {
    if (this.buscando()) return; // Evitar múltiples escaneos simultáneos
    this.buscando.set(true);
    this.errorMessage.set(null);
    this.productoEncontrado.set(null);

    try {
      // Buscamos el producto en Supabase por el código de barras
      const producto = await this.supabaseService.buscarProductoPorCodigo(codigoEscaneado);

      if (producto) {
        // ¡Existe! Lo mostramos en pantalla pero dejamos el escáner activo
        this.productoEncontrado.set(producto);
      } else {
        // No existe: redirigir al componente agregar-producto pasando el código por queryParams
        this.router.navigate(['/agregar-producto'], { queryParams: { codigo: codigoEscaneado } });
      }
    } catch (err: any) {
      this.errorMessage.set('Error al buscar el producto en la base de datos.');
    } finally {
      this.buscando.set(false);
    }
  }

  ngOnDestroy() {
    // Limpiamos la cámara al salir del componente para evitar fugas de memoria
    this.scanner?.clear().catch(error => console.error("Fallo al limpiar el escáner", error));
  }
}