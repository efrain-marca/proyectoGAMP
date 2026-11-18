import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proyecto, Usuario } from './models';

const API = 'http://localhost:3000';
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  users(): Observable<Usuario[]> { return this.http.get<Usuario[]>(`${API}/usuarios`); }
  createUser(data: Record<string, unknown>): Observable<Usuario> { return this.http.post<Usuario>(`${API}/usuarios`, data); }
  updateUser(id: number, data: Record<string, unknown>): Observable<Usuario> { return this.http.patch<Usuario>(`${API}/usuarios/${id}`, data); }
  projects(): Observable<Proyecto[]> { return this.http.get<Proyecto[]>(`${API}/proyectos`); }
  createProject(data: Record<string, unknown>): Observable<Proyecto> { return this.http.post<Proyecto>(`${API}/proyectos`, data); }
  updateProject(id: number, data: Record<string, unknown>): Observable<Proyecto> { return this.http.patch<Proyecto>(`${API}/proyectos/${id}`, data); }
}
