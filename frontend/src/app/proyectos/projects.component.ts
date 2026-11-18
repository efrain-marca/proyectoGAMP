import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../core/data.service';
import { Proyecto } from '../core/models';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <div class="page-heading"><div><p class="eyebrow">PLANIFICACIÓN MUNICIPAL</p><h1>Proyectos</h1><p class="muted">Seguimiento de la cartera de inversión municipal.</p></div><button class="primary" (click)="startNew()">+ Nuevo proyecto</button></div>
      @if (error) { <div class="alert">{{ error }}</div> }
      @if (editing) {
        <section class="panel form-panel"><div class="panel-heading"><h2>{{ editing.id ? 'Editar proyecto' : 'Registrar proyecto' }}</h2><button class="text-button" (click)="cancel()">Cancelar</button></div>
          <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
            <label>Código<input formControlName="codigo" placeholder="GAMP-2026-001"></label><label>Nombre del proyecto<input formControlName="nombre"></label>
            <label class="span-two">Descripción<textarea rows="2" formControlName="descripcion"></textarea></label><label>Ubicación<input formControlName="ubicacion"></label>
            <label>Presupuesto asignado (Bs)<input type="number" min="0" formControlName="presupuesto"></label><label>Fecha de inicio<input type="date" formControlName="fechaInicio"></label>
            <label>Fecha de conclusión<input type="date" formControlName="fechaFin"></label>
            <label>Estado<select formControlName="estado"><option value="PLANIFICADO">Planificado</option><option value="EN EJECUCIÓN">En ejecución</option><option value="PAUSADO">Pausado</option><option value="CONCLUIDO">Concluido</option><option value="CANCELADO">Cancelado</option></select></label>
            <div class="form-actions"><button class="primary" [disabled]="saving">{{ saving ? 'Guardando…' : 'Guardar proyecto' }}</button></div>
          </form>
        </section>
      }
      @if (selected) {
        <section class="panel detail"><div class="panel-heading"><div><p class="eyebrow">FICHA DEL PROYECTO</p><h2>{{ selected.nombre }}</h2></div><button class="text-button" (click)="selected = null">Cerrar detalle</button></div>
          <div class="detail-grid"><div><small>Código</small><strong>{{ selected.codigo }}</strong></div><div><small>Ubicación</small><strong>{{ selected.ubicacion }}</strong></div><div><small>Presupuesto</small><strong>Bs {{ Number(selected.presupuesto).toLocaleString('es-BO') }}</strong></div><div><small>Estado</small><strong>{{ selected.estado }}</strong></div><div><small>Fecha de inicio</small><strong>{{ selected.fechaInicio | date:'dd/MM/yyyy' }}</strong></div><div><small>Fecha de conclusión</small><strong>{{ selected.fechaFin | date:'dd/MM/yyyy' }}</strong></div><div class="span-two"><small>Descripción</small><strong>{{ selected.descripcion || 'Sin descripción' }}</strong></div></div>
        </section>
      }
      <section class="panel"><div class="panel-heading"><h2>Cartera de proyectos <span class="count">{{ projects.length }}</span></h2></div>
        @if (loading) { <p class="muted pad">Cargando proyectos…</p> }
        @else if (projects.length) { <div class="table-wrap"><table><thead><tr><th>Proyecto</th><th>Ubicación</th><th>Presupuesto</th><th>Fechas</th><th>Estado</th><th></th></tr></thead><tbody>
          @for (p of projects; track p.id) { <tr><td><button class="project-name" (click)="show(p)">{{ p.nombre }}</button><small class="table-sub">{{ p.codigo }}</small></td><td>{{ p.ubicacion }}</td><td>Bs {{ Number(p.presupuesto).toLocaleString('es-BO') }}</td><td>{{ p.fechaInicio | date:'dd/MM/yy' }} — {{ p.fechaFin | date:'dd/MM/yy' }}</td><td><span class="status">{{ p.estado }}</span></td><td><button class="text-button" (click)="edit(p)">Editar</button></td></tr> }
        </tbody></table></div> } @else { <p class="muted pad">Aún no se registraron proyectos.</p> }
      </section>
    </section>
  `,
})
export class ProjectsComponent implements OnInit {
  private readonly data = inject(DataService);
  private readonly fb = inject(FormBuilder);
  readonly Number = Number;
  readonly form = this.fb.nonNullable.group({
    codigo: ['', Validators.required], nombre: ['', Validators.required], descripcion: [''], ubicacion: ['', Validators.required],
    fechaInicio: ['', Validators.required], fechaFin: ['', Validators.required], presupuesto: [0, [Validators.required, Validators.min(0)]], estado: ['PLANIFICADO'],
  });
  projects: Proyecto[] = [];
  editing: Proyecto | null = null;
  selected: Proyecto | null = null;
  error = '';
  loading = true;
  saving = false;
  ngOnInit(): void { this.load(); }
  load(): void { this.loading = true; this.data.projects().subscribe({ next: (items) => { this.projects = items; this.loading = false; }, error: () => { this.error = 'No se pudieron cargar proyectos. Verifica la conexión con el servidor.'; this.loading = false; } }); }
  startNew(): void { this.editing = { id: 0, codigo: '', nombre: '', descripcion: '', ubicacion: '', fechaInicio: '', fechaFin: '', presupuesto: 0, estado: 'PLANIFICADO' }; this.form.reset({ codigo: '', nombre: '', descripcion: '', ubicacion: '', fechaInicio: '', fechaFin: '', presupuesto: 0, estado: 'PLANIFICADO' }); }
  edit(p: Proyecto): void { this.editing = p; this.form.reset({ codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion || '', ubicacion: p.ubicacion, fechaInicio: p.fechaInicio.slice(0, 10), fechaFin: p.fechaFin.slice(0, 10), presupuesto: Number(p.presupuesto), estado: p.estado }); }
  show(p: Proyecto): void { this.selected = p; }
  cancel(): void { this.editing = null; this.error = ''; }
  save(): void {
    this.form.markAllAsTouched(); if (!this.editing || this.form.invalid) return;
    this.saving = true; this.error = ''; const payload = this.form.getRawValue();
    const request = this.editing.id ? this.data.updateProject(this.editing.id, payload) : this.data.createProject(payload);
    request.subscribe({ next: () => { this.saving = false; this.editing = null; this.load(); }, error: (e: { error?: { message?: string } }) => { this.saving = false; this.error = e.error?.message ?? 'No se pudo guardar el proyecto.'; } });
  }
}
