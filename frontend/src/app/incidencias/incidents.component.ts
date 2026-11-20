import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../core/data.service';
import { Proyecto } from '../core/models';
import { TextOnlyDirective } from '../core/text-only.directive';

interface IncidenceView {
  id: number;
  codigo?: string;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  proyecto: Proyecto;
  createdAt: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextOnlyDirective],
  templateUrl: './incidents.component.html',
  styleUrls: ['./incidents.component.css'],
})
/*
      <div class="page-heading"><div><p class="eyebrow">GESTIÓN DE PROBLEMAS</p><h1>Incidencias</h1><p class="muted">Registra y atiende incidencias técnicas, administrativas y financieras.</p></div></div>
      @if (error) { <div class="alert">{{ error }}</div> }
      <section class="panel form-panel"><div class="panel-heading"><h2>Registrar incidencia</h2></div>
        <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
          <label>Proyecto<select formControlName="proyectoId">@for (project of projects; track project.id) { <option [ngValue]="project.id">{{ project.nombre }}</option> }</select></label>
          <label>Prioridad<select formControlName="prioridad"><option value="BAJA">Baja</option><option value="MEDIA">Media</option><option value="ALTA">Alta</option><option value="CRITICA">Crítica</option></select></label>
          <label>Título<input appTextOnly formControlName="titulo"></label>
          <label>Fecha prevista de solución<input type="date" formControlName="fechaPrevistaSolucion"></label>
          <label class="span-two">Descripción<textarea appTextOnly rows="3" formControlName="descripcion"></textarea></label>
          <div class="form-actions"><button class="primary" [disabled]="saving">{{ saving ? 'Guardando…' : 'Registrar incidencia' }}</button></div>
        </form>
      </section>
      <section class="panel"><div class="panel-heading"><h2>Incidencias registradas <span class="count">{{ incidences.length }}</span></h2></div>
        @if (incidences.length) { <div class="table-wrap"><table><thead><tr><th>Código</th><th>Título</th><th>Proyecto</th><th>Prioridad</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>@for (item of incidences; track item.id) { <tr><td>{{ item.codigo || '—' }}</td><td class="strong">{{ item.titulo }}</td><td>{{ item.proyecto.nombre }}</td><td>{{ item.prioridad }}</td><td><span class="status">{{ item.estado }}</span></td><td>{{ item.createdAt | date:'dd/MM/yyyy' }}</td></tr> }</tbody></table></div> } @else { <p class="muted pad">No hay incidencias registradas.</p> }
      </section>
    </section>
  `,
})
*/
export class IncidentsComponent implements OnInit {
  private readonly data = inject(DataService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    proyectoId: [0, Validators.required],
    prioridad: ['MEDIA'],
    titulo: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,-]+$/)]],
    fechaPrevistaSolucion: [''],
    descripcion: ['', Validators.required],
  });
  projects: Proyecto[] = [];
  incidences: IncidenceView[] = [];
  error = '';
  saving = false;
  ngOnInit(): void { this.load(); }
  load(): void {
    this.data.projects().subscribe({ next: (projects) => { this.projects = projects; this.form.patchValue({ proyectoId: projects[0]?.id ?? 0 }); } });
    this.data.incidences().subscribe({ next: (items) => { this.incidences = items as IncidenceView[]; }, error: () => { this.error = 'No se pudieron cargar las incidencias.'; } });
  }
  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving = true; this.error = '';
    const value = this.form.getRawValue();
    this.data.createIncidence({ ...value, fechaPrevistaSolucion: value.fechaPrevistaSolucion || undefined }).subscribe({
      next: () => { this.saving = false; this.form.reset({ proyectoId: this.projects[0]?.id ?? 0, prioridad: 'MEDIA', titulo: '', fechaPrevistaSolucion: '', descripcion: '' }); this.load(); },
      error: (e: { error?: { message?: string } }) => { this.saving = false; this.error = e.error?.message ?? 'No se pudo registrar la incidencia.'; },
    });
  }
}
