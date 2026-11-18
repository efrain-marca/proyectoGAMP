import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { UsersComponent } from './usuarios/users.component';
import { ProjectsComponent } from './proyectos/projects.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'usuarios', component: UsersComponent, canActivate: [authGuard] },
  { path: 'proyectos', component: ProjectsComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'proyectos' },
  { path: '**', redirectTo: 'proyectos' },
];
