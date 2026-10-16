import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-lista-compras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './lista-compras.html',
  styleUrls: ['./lista-compras.css']
})
export class ListaCompras implements OnInit {
  private supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);

  // Señales de estado
  listas = signal<any[]>([]);
  listaSeleccionadaId = signal<number | null>(null);
  productosDeLista = signal<any[]>([]);
  
  loadingListas = signal(false);
  loadingProductos = signal(false);
  errorMessage = signal<string | null>(null);
  
  // Control para mostrar/ocultar el input de nueva lista
  creandoLista = signal(false);
  
  nuevaListaForm: FormGroup = this.fb.group({
    nombre_lista: ['', [Validators.required]]
  });

  async ngOnInit() {
    await this.cargarListas();
  }

  async cargarListas() {
    try {
      this.loadingListas.set(true);
      const data = await this.supabaseService.obtenerListasCompras();
      this.listas.set(data);

      // Si hay listas creadas, seleccionamos la primera por defecto
      if (data.length > 0) {
        this.seleccionarLista(data[0].id);
      }
    } catch (err: any) {
      this.errorMessage.set('Error al cargar las listas de compras.');
    } finally {
      this.loadingListas.set(false);
    }
  }

  async seleccionarLista(listaId: number) {
    this.listaSeleccionadaId.set(listaId);
    await this.cargarProductos(listaId);
  }

  async cargarProductos(listaId: number) {
    try {
      this.loadingProductos.set(true);
      const productos = await this.supabaseService.obtenerProductosDeLista(listaId);
      this.productosDeLista.set(productos);
    } catch (err: any) {
      this.errorMessage.set('Error al cargar los productos de la lista.');
    } finally {
      this.loadingProductos.set(false);
    }
  }

  async crearNuevaLista() {
    if (this.nuevaListaForm.invalid) return;

    const nombre = this.nuevaListaForm.value.nombre_lista;

    try {
      this.loadingListas.set(true);
      const nuevaLista = await this.supabaseService.crearListaCompra(nombre);
      
      // Actualizamos el array local y seleccionamos la nueva lista creada
      this.listas.update(listasActuales => [nuevaLista, ...listasActuales]);
      this.seleccionarLista(nuevaLista.id);

      // Limpiamos y cerramos el form de creación
      this.nuevaListaForm.reset();
      this.creandoLista.set(false);
    } catch (err: any) {
      this.errorMessage.set('Error al crear la nueva lista.');
    } finally {
      this.loadingListas.set(false);
    }
  }

  onCambiarLista(event: any) {
    const id = Number(event.target.value);
    if (id) {
      this.seleccionarLista(id);
    }
  }

  // --- NUEVAS FUNCIONES ---

  // Marcar como comprado o pendiente
  async toggleComprado(item: any) {
    try {
      const nuevoEstado = !item.comprado;
      await this.supabaseService.actualizarEstadoProducto(item.id, nuevoEstado);
      
      // Corregido: usamos la señal correcta 'productosDeLista'
      this.productosDeLista.update(productos => 
        productos.map(p => p.id === item.id ? { ...p, comprado: nuevoEstado } : p)
      );
    } catch (err) {
      this.errorMessage.set('Error al actualizar el estado del producto.');
    }
  }

  // Eliminar un producto individual de la lista
  async eliminarProducto(itemId: number) {
    try {
      await this.supabaseService.eliminarProductoDeLista(itemId);
      this.productosDeLista.update(productos => productos.filter(p => p.id !== itemId));
    } catch (err) {
      this.errorMessage.set('Error al eliminar el producto.');
    }
  }

  // Eliminar la lista completa de la BD
  async eliminarListaActual() {
    const listaId = this.listaSeleccionadaId();
    if (!listaId) return;

    const confirmar = window.confirm('¿Estás seguro de que querés eliminar esta lista completa?');
    if (!confirmar) return;

    try {
      await this.supabaseService.eliminarListaCompra(listaId);
      
      this.listas.update(listas => listas.filter(l => l.id !== listaId));
      this.listaSeleccionadaId.set(null);
      this.productosDeLista.set([]);

      const remainingListas = this.listas();
      if (remainingListas.length > 0) {
        this.seleccionarLista(remainingListas[0].id);
      }
    } catch (err) {
      this.errorMessage.set('Error al eliminar la lista de compras.');
    }
  }
}