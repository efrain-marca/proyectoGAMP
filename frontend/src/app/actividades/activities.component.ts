import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../core/data.service';
import { Actividad, Proyecto } from '../core/models';
import { TextOnlyDirective } from '../core/text-only.directive';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextOnlyDirective],
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.css'],
})
/*
      <div class="page-heading"><div><p class="eyebrow">SEGUIMIENTO OPERATIVO</p><h1>Actividades</h1><p class="muted">Planifica actividades y controla su avance físico.</p></div><button class="primary" (click)="startNew()">+ Nueva actividad</button></div>
      @if (error) { <div class="alert">{{ error }}</div> }
      @if (editing) {
        <section class="panel form-panel"><div class="panel-heading"><h2>{{ editing.id ? 'Editar actividad' : 'Registrar actividad' }}</h2><button class="text-button" (click)="cancel()">Cancelar</button></div>
          <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
            <label>Proyecto<select formControlName="proyectoId">@for (project of projects; track project.id) { <option [ngValue]="project.id">{{ project.nombre }}</option> }</select></label>
            <label>Nombre<input appTextOnly formControlName="nombre"></label>
            <label class="span-two">Descripción<textarea appTextOnly rows="2" formControlName="descripcion"></textarea></label>
            <label>Fecha de inicio<input type="date" formControlName="fechaInicio"></label>
            <label>Fecha de conclusión<input type="date" formControlName="fechaFin"></label>
            <label>Avance (%)<input type="number" min="0" max="100" step="0.01" formControlName="avance"></label>
            @if (form.controls.nombre.touched && form.controls.nombre.invalid) { <small class="validation">El nombre solo admite letras y espacios.</small> }
            @if (form.controls.avance.touched && form.controls.avance.invalid) { <small class="validation">El avance debe estar entre 0 y 100.</small> }
            @if (form.controls.fechaFin.touched && form.controls.fechaFin.value && form.controls.fechaInicio.value && form.controls.fechaFin.value < form.controls.fechaInicio.value) { <small class="validation span-two">La fecha de conclusión no puede ser anterior al inicio.</small> }
            <div class="form-actions"><button class="primary" [disabled]="saving">{{ saving ? 'Guardando…' : 'Guardar actividad' }}</button></div>
          </form>
        </section>
      }
      <section class="panel"><div class="panel-heading"><h2>Actividades registradas <span class="count">{{ activities.length }}</span></h2></div>
        @if (loading) { <p class="muted pad">Cargando actividades…</p> } @else if (activities.length) {
          <div class="table-wrap"><table><thead><tr><th>Actividad</th><th>Proyecto</th><th>Fechas</th><th>Avance</th><th></th></tr></thead><tbody>
            @for (activity of activities; track activity.id) { <tr><td class="strong">{{ activity.nombre }}</td><td>{{ activity.proyecto.nombre }}</td><td>{{ activity.fechaInicio | date:'dd/MM/yy' }} — {{ activity.fechaFin | date:'dd/MM/yy' }}</td><td>{{ Number(activity.avance).toFixed(2) }}%</td><td><button class="text-button" (click)="edit(activity)">Editar</button> <button class="text-button danger" (click)="deleteActivity(activity)">Eliminar</button></td></tr> }
          </tbody></table></div>
        } @else { <p class="muted pad">No hay actividades registradas.</p> }
      </section>
    </section>
  `,
})
*/
export class ActivitiesComponent implements OnInit {
  private readonly data = inject(DataService);
  private readonly fb = inject(FormBuilder);
  readonly Number = Number;
  readonly form = this.fb.nonNullable.group({
    proyectoId: [0, Validators.required],
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/)]],
    descripcion: ['', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/)],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    avance: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
  });
  projects: Proyecto[] = [];
  activities: Actividad[] = [];
  editing: Actividad | null = null;
  error = '';
  loading = true;
  saving = false;
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.data.projects().subscribe({ next: (projects) => { this.projects = projects; }, error: () => { this.error = 'No se pudieron cargar proyectos.'; } });
    this.data.activities().subscribe({ next: (activities) => { this.activities = activities; this.loading = false; }, error: (e: { error?: { message?: string } }) => { this.error = e.error?.message ?? 'No se pudieron cargar actividades.'; this.loading = false; } });
  }
  startNew(): void { this.editing = { id: 0, nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', avance: 0, proyecto: this.projects[0] }; this.form.reset({ proyectoId: this.projects[0]?.id ?? 0, nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', avance: 0 }); }
  edit(activity: Actividad): void { this.editing = activity; this.form.reset({ proyectoId: activity.proyecto.id, nombre: activity.nombre, descripcion: activity.descripcion ?? '', fechaInicio: activity.fechaInicio.slice(0, 10), fechaFin: activity.fechaFin.slice(0, 10), avance: Number(activity.avance) }); }
  cancel(): void { this.editing = null; this.error = ''; }
  save(): void {
    this.form.markAllAsTouched();
    if (!this.editing || this.form.invalid) return;
    const payload = this.form.getRawValue();
    if (payload.fechaFin < payload.fechaInicio) { this.error = 'La fecha de conclusión no puede ser anterior a la fecha de inicio.'; return; }
    this.saving = true; this.error = '';
    const request = this.editing.id ? this.data.updateActivity(this.editing.id, payload) : this.data.createActivity(payload);
    request.subscribe({ next: () => { this.saving = false; this.editing = null; this.load(); }, error: (e: { error?: { message?: string } }) => { this.saving = false; this.error = e.error?.message ?? 'No se pudo guardar la actividad.'; } });
  }
  deleteActivity(activity: Actividad): void {
    if (!confirm(`¿Eliminar la actividad ${activity.nombre}?`)) return;
    this.data.deleteActivity(activity.id).subscribe({ next: () => this.load(), error: (e: { error?: { message?: string } }) => { this.error = e.error?.message ?? 'No se pudo eliminar la actividad.'; } });
  }
}
