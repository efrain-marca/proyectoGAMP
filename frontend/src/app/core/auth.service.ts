import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

const API = 'http://localhost:3000';
interface LoginResponse { access_token: string; usuario: { id: number; nombre: string; correo: string; rol: string }; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  login(correo: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API}/auth/login`, { correo, password }).pipe(
      tap((response) => {
        localStorage.setItem('gamp_token', response.access_token);
        localStorage.setItem('gamp_user', JSON.stringify(response.usuario));
      }),
    );
  }
  get token(): string | null { return localStorage.getItem('gamp_token'); }
  get user(): LoginResponse['usuario'] | null {
    const stored = localStorage.getItem('gamp_user');
    return stored ? JSON.parse(stored) as LoginResponse['usuario'] : null;
  }
  logout(): void {
    localStorage.removeItem('gamp_token');
    localStorage.removeItem('gamp_user');
    void this.router.navigate(['/login']);
  }
}
