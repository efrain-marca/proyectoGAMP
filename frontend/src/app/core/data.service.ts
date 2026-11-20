import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Actividad, Alerta, AvanceFinanciero, AvanceFisico, Proyecto, PublicProject, PublicStatistics, ReporteProyecto, Usuario } from './models';

const API = 'http://localhost:3000';
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  users(): Observable<Usuario[]> { return this.http.get<Usuario[]>(`${API}/usuarios`); }
  createUser(data: Record<string, unknown>): Observable<Usuario> { return this.http.post<Usuario>(`${API}/usuarios`, data); }
  updateUser(id: number, data: Record<string, unknown>): Observable<Usuario> { return this.http.patch<Usuario>(`${API}/usuarios/${id}`, data); }
  deleteUser(id: number): Observable<void> { return this.http.delete<void>(`${API}/usuarios/${id}`); }
  projects(): Observable<Proyecto[]> { return this.http.get<Proyecto[]>(`${API}/proyectos`); }
  createProject(data: Record<string, unknown>): Observable<Proyecto> { return this.http.post<Proyecto>(`${API}/proyectos`, data); }
  updateProject(id: number, data: Record<string, unknown>): Observable<Proyecto> { return this.http.patch<Proyecto>(`${API}/proyectos/${id}`, data); }
  deleteProject(id: number): Observable<void> { return this.http.delete<void>(`${API}/proyectos/${id}`); }
  activities(): Observable<Actividad[]> { return this.http.get<Actividad[]>(`${API}/actividades`); }
  createActivity(data: Record<string, unknown>): Observable<Actividad> { return this.http.post<Actividad>(`${API}/actividades`, data); }
  updateActivity(id: number, data: Record<string, unknown>): Observable<Actividad> { return this.http.patch<Actividad>(`${API}/actividades/${id}`, data); }
  deleteActivity(id: number): Observable<void> { return this.http.delete<void>(`${API}/actividades/${id}`); }
  physicalProgress(): Observable<AvanceFisico[]> { return this.http.get<AvanceFisico[]>(`${API}/avances-fisicos`); }
  createPhysicalProgress(data: Record<string, unknown>): Observable<AvanceFisico> { return this.http.post<AvanceFisico>(`${API}/avances-fisicos`, data); }
  financialProgress(): Observable<AvanceFinanciero[]> { return this.http.get<AvanceFinanciero[]>(`${API}/avances-financieros`); }
  createFinancialProgress(data: Record<string, unknown>): Observable<AvanceFinanciero> { return this.http.post<AvanceFinanciero>(`${API}/avances-financieros`, data); }
  alerts(): Observable<Alerta[]> { return this.http.get<Alerta[]>(`${API}/alertas`); }
  reports(): Observable<ReporteProyecto[]> { return this.http.get<ReporteProyecto[]>(`${API}/reportes/proyectos`); }
  myProjects(): Observable<{ proyecto: Proyecto }[]> { return this.http.get<{ proyecto: Proyecto }[]>(`${API}/responsables/mis-proyectos`); }
  assignments(): Observable<unknown[]> { return this.http.get<unknown[]>(`${API}/responsables`); }
  assignResponsible(data: Record<string, unknown>): Observable<unknown> { return this.http.post(`${API}/responsables`, data); }
  finalizeAssignment(id: number): Observable<unknown> { return this.http.patch(`${API}/responsables/${id}/finalizar`, {}); }
  publicProjects(params: Record<string, string> = {}): Observable<{ items: PublicProject[]; total: number; page: number; pages: number }> {
    const search = new URLSearchParams(params).toString();
    return this.http.get<{ items: PublicProject[]; total: number; page: number; pages: number }>(`${API}/publico/proyectos${search ? `?${search}` : ''}`);
  }
  publicProject(id: number): Observable<PublicProject & Record<string, unknown>> { return this.http.get<PublicProject & Record<string, unknown>>(`${API}/publico/proyectos/${id}`); }
  publicStatistics(): Observable<PublicStatistics> { return this.http.get<PublicStatistics>(`${API}/publico/estadisticas`); }
  publicMap(): Observable<{ id: number; nombre: string; codigo: string; estado: string; latitud: number; longitud: number; avance: number }[]> { return this.http.get<{ id: number; nombre: string; codigo: string; estado: string; latitud: number; longitud: number; avance: number }[]>(`${API}/publico/mapa`); }
  incidences(): Observable<unknown[]> { return this.http.get<unknown[]>(`${API}/incidencias`); }
  createIncidence(data: Record<string, unknown>): Observable<unknown> { return this.http.post(`${API}/incidencias`, data); }
  budget(projectId: number): Observable<unknown> { return this.http.get(`${API}/presupuestos/proyecto/${projectId}`); }
  modifyBudget(data: Record<string, unknown>): Observable<unknown> { return this.http.post(`${API}/presupuestos/modificar`, data); }
  documents(projectId: number): Observable<unknown[]> { return this.http.get<unknown[]>(`${API}/documentos/proyecto/${projectId}`); }
  pendingPhysical(): Observable<AvanceFisico[]> { return this.http.get<AvanceFisico[]>(`${API}/avances-fisicos/pendientes`); }
  approvePhysical(id: number): Observable<AvanceFisico> { return this.http.patch<AvanceFisico>(`${API}/avances-fisicos/${id}/aprobar`, {}); }
}
