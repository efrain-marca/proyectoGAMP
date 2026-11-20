import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { UsersComponent } from './usuarios/users.component';
import { ProjectsComponent } from './proyectos/projects.component';
import { authGuard } from './core/auth.guard';
import { ActivitiesComponent } from './actividades/activities.component';
import { TrackingComponent } from './seguimiento/tracking.component';
import { ReportsComponent } from './reportes/reports.component';
import { PublicPortalComponent } from './publico/public-portal.component';
import { PublicProjectComponent } from './publico/public-project.component';
import { IncidentsComponent } from './incidencias/incidents.component';
import { ResponsiblesComponent } from './responsables/responsibles.component';

export const routes: Routes = [
  { path: 'publico', component: PublicPortalComponent },
  { path: 'publico/:id', component: PublicProjectComponent },
  { path: 'login', component: LoginComponent },
  { path: 'usuarios', component: UsersComponent, canActivate: [authGuard] },
  { path: 'proyectos', component: ProjectsComponent, canActivate: [authGuard] },
  { path: 'actividades', component: ActivitiesComponent, canActivate: [authGuard] },
  { path: 'seguimiento', component: TrackingComponent, canActivate: [authGuard] },
  { path: 'reportes', component: ReportsComponent, canActivate: [authGuard] },
  { path: 'incidencias', component: IncidentsComponent, canActivate: [authGuard] },
  { path: 'responsables', component: ResponsiblesComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'publico' },
  { path: '**', redirectTo: 'proyectos' },
];
