import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'gamp-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (router.url !== '/login') {
      <header class="topbar">
        <a class="brand" routerLink="/proyectos"><span class="seal">P</span><span>GAMP <small>GESTIÓN MUNICIPAL</small></span></a>
        <nav><a routerLink="/proyectos" routerLinkActive="active">Proyectos</a><a routerLink="/usuarios" routerLinkActive="active">Usuarios</a></nav>
        <div class="session"><span>{{ auth.user?.nombre || 'Sesión activa' }}</span><button class="logout" (click)="auth.logout()">Cerrar sesión</button></div>
      </header>
    }
    <main [class.login-main]="router.url === '/login'"><router-outlet /></main>
    <footer>Gobierno Autónomo Municipal de Potosí <span>•</span> Sistema de Seguimiento y Control de Proyectos</footer>
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
}
