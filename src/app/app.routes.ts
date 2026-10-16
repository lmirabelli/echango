import { Routes } from '@angular/router';
import { IndexViewComponent } from './components/index-view/index-view';
import { IniciarSesionComponent } from './components/iniciar-sesion/iniciar-sesion';
import { RegisterFormComponent } from './components/registro/registro';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: IndexViewComponent },
  { path: 'iniciar-sesion', component: IniciarSesionComponent },
  { path: 'registro', component: RegisterFormComponent },
  { path: '**', redirectTo: '' } // Comodín para URLs no encontradas
];