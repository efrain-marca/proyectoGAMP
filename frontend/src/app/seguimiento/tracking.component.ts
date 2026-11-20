import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../core/data.service';
import { Actividad, Alerta, AvanceFinanciero, AvanceFisico, Proyecto } from '../core/models';
import { TextOnlyDirective } from '../core/text-only.directive';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextOnlyDirective],
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.css'],
})
/*
      <div class="page-heading"><div><p class="eyebrow">CONTROL Y AVANCES</p><h1>Seguimiento</h1><p class="muted">Registra avances físicos y financieros del proyecto.</p></div></div>
      @if (error) { <div class="alert">{{ error }}</div> }
      <div class="form-grid">
        <section class="panel span-two"><div class="panel-heading"><h2>Registrar avance físico</h2></div>
          <form [formGroup]="physicalForm" (ngSubmit)="savePhysical()" class="form-grid">
            <label>Proyecto<select formControlName="proyectoId" (change)="loadActivitiesForProject()">@for (project of projects; track project.id) { <option [ngValue]="project.id">{{ project.nombre }}</option> }</select></label>
            <label>Actividad<select formControlName="actividadId"><option [ngValue]="null">General del proyecto</option>@for (activity of projectActivities; track activity.id) { <option [ngValue]="activity.id">{{ activity.nombre }}</option> }</select></label>
            <label>Porcentaje (%)<input type="number" min="0" max="100" step="0.01" formControlName="porcentaje"></label>
            <label>Observación<input appTextOnly formControlName="observacion"></label>
            <div class="form-actions"><button class="primary" [disabled]="savingPhysical">{{ savingPhysical ? 'Guardando…' : 'Registrar avance físico' }}</button></div>
          </form>
        </section>
        <section class="panel span-two"><div class="panel-heading"><h2>Registrar avance financiero</h2></div>
          <form [formGroup]="financialForm" (ngSubmit)="saveFinancial()" class="form-grid">
            <label>Proyecto<select formControlName="proyectoId">@for (project of projects; track project.id) { <option [ngValue]="project.id">{{ project.nombre }}</option> }</select></label>
            <label>Monto (Bs)<input type="number" min="0.01" step="0.01" formControlName="monto"></label>
            <label>Referencia<input formControlName="referencia" placeholder="Factura o comprobante"></label>
            <label>Observación<input appTextOnly formControlName="observacion"></label>
            <div class="form-actions"><button class="primary" [disabled]="savingFinancial">{{ savingFinancial ? 'Guardando…' : 'Registrar avance financiero' }}</button></div>
          </form>
        </section>
      </div>
      <section class="panel"><div class="panel-heading"><h2>Avances físicos <span class="count">{{ physical.length }}</span></h2></div>
        @if (physical.length) { <div class="table-wrap"><table><thead><tr><th>Proyecto</th><th>Actividad</th><th>Porcentaje</th><th>Fecha</th><th>Usuario</th></tr></thead><tbody>
          @for (item of physical; track item.id) { <tr><td>{{ item.proyecto.nombre }}</td><td>{{ item.actividad?.nombre || 'General' }}</td><td>{{ Number(item.porcentaje).toFixed(2) }}%</td><td>{{ item.fecha | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ item.usuario.nombre }}</td></tr> }
        </tbody></table></div> } @else { <p class="muted pad">No hay avances físicos registrados.</p> }
      </section>
      <section class="panel"><div class="panel-heading"><h2>Avances pendientes de revisión <span class="count">{{ pending.length }}</span></h2></div>
        @if (pending.length) { <div class="table-wrap"><table><thead><tr><th>Proyecto</th><th>Actividad</th><th>Porcentaje</th><th>Estado</th><th></th></tr></thead><tbody>@for (item of pending; track item.id) { <tr><td>{{ item.proyecto.nombre }}</td><td>{{ item.actividad?.nombre || 'General' }}</td><td>{{ Number(item.porcentaje).toFixed(2) }}%</td><td>{{ item.estado }}</td><td><button class="text-button" (click)="approve(item)">Aprobar y publicar</button></td></tr> }</tbody></table></div> } @else { <p class="muted pad">No hay avances pendientes.</p> }
      </section>
      <section class="panel"><div class="panel-heading"><h2>Avances financieros <span class="count">{{ financial.length }}</span></h2></div>
        @if (financial.length) { <div class="table-wrap"><table><thead><tr><th>Proyecto</th><th>Monto</th><th>Referencia</th><th>Fecha</th><th>Usuario</th></tr></thead><tbody>
          @for (item of financial; track item.id) { <tr><td>{{ item.proyecto.nombre }}</td><td>Bs {{ Number(item.monto).toLocaleString('es-BO') }}</td><td>{{ item.referencia || '—' }}</td><td>{{ item.fecha | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ item.usuario.nombre }}</td></tr> }
        </tbody></table></div> } @else { <p class="muted pad">No hay avances financieros registrados.</p> }
      </section>
      <section class="panel"><div class="panel-heading"><h2>Alertas <span class="count">{{ alerts.length }}</span></h2></div>
        @if (alerts.length) { <div class="table-wrap"><table><thead><tr><th>Proyecto</th><th>Actividad</th><th>Fecha fin</th><th>Avance</th></tr></thead><tbody>
          @for (alert of alerts; track alert.actividadId) { <tr><td>{{ alert.proyecto }}</td><td>{{ alert.actividad }}</td><td>{{ alert.fechaFin | date:'dd/MM/yyyy' }}</td><td>{{ alert.avance }}%</td></tr> }
        </tbody></table></div> } @else { <p class="muted pad">No existen alertas vencidas.</p> }
      </section>
    </section>
  `,
})
*/
export class TrackingComponent implements OnInit {
  private readonly data = inject(DataService);
  private readonly fb = inject(FormBuilder);
  readonly Number = Number;
  readonly physicalForm = this.fb.nonNullable.group({ proyectoId: [0, Validators.required], actividadId: [null as number | null], porcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]], observacion: ['', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/)] });
  readonly financialForm = this.fb.nonNullable.group({ proyectoId: [0, Validators.required], monto: [0, [Validators.required, Validators.min(0.01)]], referencia: ['', Validators.pattern(/^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ_-]*$/)], observacion: ['', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/)] });
  projects: Proyecto[] = [];
  activities: Actividad[] = [];
  projectActivities: Actividad[] = [];
  physical: AvanceFisico[] = [];
  financial: AvanceFinanciero[] = [];
  pending: AvanceFisico[] = [];
  alerts: Alerta[] = [];
  error = '';
  savingPhysical = false;
  savingFinancial = false;
  ngOnInit(): void { this.load(); }
  load(): void {
    this.data.projects().subscribe({ next: (projects) => { this.projects = projects; this.physicalForm.patchValue({ proyectoId: projects[0]?.id ?? 0 }); this.financialForm.patchValue({ proyectoId: projects[0]?.id ?? 0 }); this.loadActivitiesForProject(); }, error: () => { this.error = 'No se pudieron cargar los proyectos.'; } });
    this.data.activities().subscribe({ next: (activities) => { this.activities = activities; this.loadActivitiesForProject(); } });
    this.data.physicalProgress().subscribe({ next: (items) => { this.physical = items; } });
    this.data.financialProgress().subscribe({ next: (items) => { this.financial = items; } });
    this.data.alerts().subscribe({ next: (items) => { this.alerts = items; } });
    this.data.pendingPhysical().subscribe({ next: (items) => { this.pending = items; }, error: () => { this.pending = []; } });
  }
  loadActivitiesForProject(): void {
    const id = this.physicalForm.getRawValue().proyectoId;
    this.projectActivities = this.activities.filter((activity) => activity.proyecto.id === id);
  }
  savePhysical(): void {
    this.physicalForm.markAllAsTouched();
    if (this.physicalForm.invalid) return;
    this.savingPhysical = true; this.error = '';
    this.data.createPhysicalProgress(this.physicalForm.getRawValue()).subscribe({ next: () => { this.savingPhysical = false; this.load(); }, error: (e: { error?: { message?: string } }) => { this.savingPhysical = false; this.error = e.error?.message ?? 'No se pudo registrar el avance físico.'; } });
  }
  saveFinancial(): void {
    this.financialForm.markAllAsTouched();
    if (this.financialForm.invalid) return;
    this.savingFinancial = true; this.error = '';
    this.data.createFinancialProgress(this.financialForm.getRawValue()).subscribe({ next: () => { this.savingFinancial = false; this.load(); }, error: (e: { error?: { message?: string } }) => { this.savingFinancial = false; this.error = e.error?.message ?? 'No se pudo registrar el avance financiero.'; } });
  }
  approve(item: AvanceFisico): void {
    this.data.approvePhysical(item.id).subscribe({ next: () => this.load(), error: (e: { error?: { message?: string } }) => { this.error = e.error?.message ?? 'No se pudo aprobar el avance.'; } });
  }
}
