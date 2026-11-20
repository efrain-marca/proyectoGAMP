import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../core/data.service';
import { Proyecto } from '../core/models';
import { TextOnlyDirective } from '../core/text-only.directive';
import * as L from 'leaflet';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextOnlyDirective],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
})
/*
      <div class="page-heading"><div><p class="eyebrow">PLANIFICACIÓN MUNICIPAL</p><h1>Proyectos</h1><p class="muted">Seguimiento de la cartera de inversión municipal.</p></div><button class="primary" (click)="startNew()">+ Nuevo proyecto</button></div>
      @if (error) { <div class="alert">{{ error }}</div> }
      @if (editing) {
        <section class="panel form-panel"><div class="panel-heading"><h2>{{ editing.id ? 'Editar proyecto' : 'Registrar proyecto' }}</h2><button class="text-button" (click)="cancel()">Cancelar</button></div>
          <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
            <label>Código<input formControlName="codigo" placeholder="GAMP-2026-001"></label><label>Nombre del proyecto<input appTextOnly formControlName="nombre"></label>
            <label class="span-two">Descripción<textarea appTextOnly rows="2" formControlName="descripcion"></textarea></label><label>Ubicación<input appTextOnly formControlName="ubicacion"></label>
            <label>Presupuesto asignado (Bs)<input type="number" min="0" step="0.01" formControlName="presupuesto"></label><label>Fecha de inicio<input type="date" formControlName="fechaInicio"></label>
            <label>Fecha de conclusión<input type="date" formControlName="fechaFin"></label>
            <label>Estado<select formControlName="estado"><option value="REGISTRADO">Registrado</option><option value="PLANIFICADO">Planificado</option><option value="EN EJECUCIÓN">En ejecución</option><option value="SUSPENDIDO">Suspendido</option><option value="PAUSADO">Pausado</option><option value="CONCLUIDO">Concluido</option><option value="CANCELADO">Cancelado</option></select></label>
            <label>Tipo de proyecto<input appTextOnly formControlName="tipoProyecto" placeholder="Educación, salud, vial"></label>
            <label>Distrito o zona<input appTextOnly formControlName="distrito"></label>
            <label>Comunidad<input appTextOnly formControlName="comunidad"></label>
            <label>Unidad organizacional<input appTextOnly formControlName="unidadOrganizacional"></label>
            <label>Modalidad de ejecución<input appTextOnly formControlName="modalidad"></label>
            <label>Latitud<input type="number" step="0.0000001" formControlName="latitud" readonly></label>
            <label>Longitud<input type="number" step="0.0000001" formControlName="longitud" readonly></label>
            <div class="span-two"><label>Ubicación geográfica</label><div id="project-map" class="project-map"></div><small class="muted">Haz clic en el mapa para seleccionar la ubicación.</small></div>
            <label class="span-two">Observaciones<textarea appTextOnly rows="2" formControlName="observaciones"></textarea></label>
            <label>Publicar en portal<select formControlName="publicado"><option [ngValue]="true">Sí</option><option [ngValue]="false">No</option></select></label>
            <label>Publicar avance financiero<select formControlName="publicarFinanciero"><option [ngValue]="true">Sí</option><option [ngValue]="false">No</option></select></label>
            @if (form.controls.codigo.touched && form.controls.codigo.invalid) { <small class="validation">El código debe tener al menos 2 caracteres y no admitir espacios.</small> }
            @if (form.controls.nombre.touched && form.controls.nombre.invalid) { <small class="validation">El nombre solo admite letras y espacios.</small> }
            @if (form.controls.descripcion.touched && form.controls.descripcion.invalid) { <small class="validation">La descripción solo admite letras y espacios.</small> }
            @if (form.controls.ubicacion.touched && form.controls.ubicacion.invalid) { <small class="validation">La ubicación solo admite letras y espacios.</small> }
            @if (form.controls.presupuesto.touched && form.controls.presupuesto.invalid) { <small class="validation">El presupuesto debe ser un monto igual o mayor que cero.</small> }
            @if (form.controls.fechaInicio.touched && form.controls.fechaInicio.invalid) { <small class="validation">Selecciona una fecha de inicio válida.</small> }
            @if (form.controls.fechaFin.touched && form.controls.fechaFin.invalid) { <small class="validation">Selecciona una fecha de conclusión válida.</small> }
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
          @for (p of projects; track p.id) { <tr><td><button class="project-name" (click)="show(p)">{{ p.nombre }}</button><small class="table-sub">{{ p.codigo }}</small></td><td>{{ p.ubicacion }}</td><td>Bs {{ Number(p.presupuesto).toLocaleString('es-BO') }}</td><td>{{ p.fechaInicio | date:'dd/MM/yy' }} — {{ p.fechaFin | date:'dd/MM/yy' }}</td><td><span class="status">{{ p.estado }}</span></td><td><button class="text-button" (click)="edit(p)">Editar</button> <button class="text-button danger" (click)="deleteProject(p)">Eliminar</button></td></tr> }
        </tbody></table></div> } @else { <p class="muted pad">Aún no se registraron proyectos.</p> }
      </section>
    </section>
  `,
})
*/
export class ProjectsComponent implements OnInit {
  private readonly data = inject(DataService);
  private readonly fb = inject(FormBuilder);
  readonly Number = Number;
  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ_-]+$/)]],
    nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/)]],
    descripcion: ['', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/)],
    ubicacion: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/)]],
    fechaInicio: ['', Validators.required], fechaFin: ['', Validators.required], presupuesto: [0, [Validators.required, Validators.min(0)]], estado: ['PLANIFICADO'],
    tipoProyecto: ['', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/)],
    distrito: ['', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]*$/)],
    comunidad: ['', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]*$/)],
    unidadOrganizacional: ['', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/)],
    modalidad: ['', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/)],
    latitud: [null as number | null],
    longitud: [null as number | null],
    observaciones: ['', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9.,;:\s]*$/)],
    publicado: [false],
    publicarFinanciero: [false],
  });
  projects: Proyecto[] = [];
  editing: Proyecto | null = null;
  selected: Proyecto | null = null;
  error = '';
  loading = true;
  saving = false;
  private map: L.Map | null = null;
  private marker: L.CircleMarker | null = null;
  ngOnInit(): void { this.load(); }
  load(): void { this.loading = true; this.data.projects().subscribe({ next: (items) => { this.projects = items; this.loading = false; }, error: () => { this.error = 'No se pudieron cargar proyectos. Verifica la conexión con el servidor.'; this.loading = false; } }); }
  startNew(): void { this.editing = { id: 0, codigo: '', nombre: '', descripcion: '', ubicacion: '', fechaInicio: '', fechaFin: '', presupuesto: 0, estado: 'PLANIFICADO' }; this.form.reset({ codigo: '', nombre: '', descripcion: '', ubicacion: '', fechaInicio: '', fechaFin: '', presupuesto: 0, estado: 'PLANIFICADO', tipoProyecto: '', distrito: '', comunidad: '', unidadOrganizacional: '', modalidad: '', latitud: null, longitud: null, observaciones: '', publicado: false, publicarFinanciero: false }); this.initProjectMap(null, null); }
  edit(p: Proyecto): void { this.editing = p; this.form.reset({ codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion || '', ubicacion: p.ubicacion, fechaInicio: p.fechaInicio.slice(0, 10), fechaFin: p.fechaFin.slice(0, 10), presupuesto: Number(p.presupuesto), estado: p.estado, tipoProyecto: p.tipoProyecto || '', distrito: p.distrito || '', comunidad: p.comunidad || '', unidadOrganizacional: p.unidadOrganizacional || '', modalidad: p.modalidad || '', latitud: p.latitud == null ? null : Number(p.latitud), longitud: p.longitud == null ? null : Number(p.longitud), observaciones: p.observaciones || '', publicado: p.publicado ?? false, publicarFinanciero: p.publicarFinanciero ?? false }); this.initProjectMap(p.latitud == null ? null : Number(p.latitud), p.longitud == null ? null : Number(p.longitud)); }
  private initProjectMap(latitud: number | null, longitud: number | null): void {
    setTimeout(() => {
      if (this.map) { this.map.remove(); this.map = null; this.marker = null; }
      const center: L.LatLngExpression = latitud !== null && longitud !== null ? [latitud, longitud] : [-19.589, -65.754];
      this.map = L.map('project-map').setView(center, latitud !== null ? 15 : 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(this.map);
      if (latitud !== null && longitud !== null) this.marker = L.circleMarker(center, { radius: 8, color: '#173d61' }).addTo(this.map);
      this.map.on('click', (event: L.LeafletMouseEvent) => {
        const point = event.latlng;
        this.form.patchValue({ latitud: Number(point.lat.toFixed(7)), longitud: Number(point.lng.toFixed(7)) });
        if (this.marker) this.map?.removeLayer(this.marker);
        this.marker = L.circleMarker([point.lat, point.lng], { radius: 8, color: '#173d61' }).addTo(this.map as L.Map);
      });
    });
  }
  show(p: Proyecto): void { this.selected = p; }
  cancel(): void { this.editing = null; this.error = ''; }
  deleteProject(project: Proyecto): void {
    if (!confirm(`¿Eliminar el proyecto ${project.nombre}?`)) return;
    this.data.deleteProject(project.id).subscribe({ next: () => { this.selected = null; this.load(); }, error: (e: { error?: { message?: string } }) => { this.error = e.error?.message ?? 'No se pudo eliminar el proyecto.'; } });
  }
  save(): void {
    this.form.markAllAsTouched(); if (!this.editing || this.form.invalid) return;
    const payload = this.form.getRawValue();
    if (payload.fechaFin < payload.fechaInicio) {
      this.error = 'La fecha de conclusión no puede ser anterior a la fecha de inicio.';
      return;
    }
    this.saving = true; this.error = '';
    const cleanPayload = {
      ...payload,
      latitud: typeof payload.latitud === 'number' ? payload.latitud : undefined,
      longitud: typeof payload.longitud === 'number' ? payload.longitud : undefined,
    };
    const request = this.editing.id ? this.data.updateProject(this.editing.id, cleanPayload) : this.data.createProject(cleanPayload);
    request.subscribe({ next: () => { this.saving = false; this.editing = null; this.load(); }, error: (e: { error?: { message?: string } }) => { this.saving = false; this.error = e.error?.message ?? 'No se pudo guardar el proyecto.'; } });
  }
}
