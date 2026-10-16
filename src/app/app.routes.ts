import { Routes } from '@angular/router';
import { IndexViewComponent } from './components/index-view/index-view';
import { IniciarSesionComponent } from './components/iniciar-sesion/iniciar-sesion';
import { RegisterFormComponent } from './components/registro/registro';
import { authGuard } from './guards/auth.guard';
import { MenuPrincipal } from './components/menu-principal/menu-principal';
import { RealizarCompras } from './components/realizar-compras/realizar-compras';
import { ListaCompras } from './components/lista-compras/lista-compras';
import { BuscarProducto } from './components/buscar-producto/buscar-producto';
import { AgregarProducto } from './components/agregar-producto/agregar-producto';

export const routes: Routes = [
  { path: '', component: IndexViewComponent },
  { path: 'iniciar-sesion', component: IniciarSesionComponent },
  { path: 'registro', component: RegisterFormComponent },
  { 
    path: 'menu-principal', 
    component: MenuPrincipal, 
    canActivate: [authGuard] // Protegido para que solo entren usuarios logueados
  },
  { 
    path: 'realizar-compras', 
    component: RealizarCompras, 
    canActivate: [authGuard] 
  },
  { 
    path: 'lista-compras', 
    component: ListaCompras, 
    canActivate: [authGuard] 
  },
  { 
    path: 'buscar-producto', 
    component: BuscarProducto, 
    canActivate: [authGuard] 
  },
  {
    path: 'agregar-producto',
    component: AgregarProducto,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' } // Comodín para URLs no encontradas
];