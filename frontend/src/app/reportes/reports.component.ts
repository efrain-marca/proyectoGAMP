import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../core/data.service';
import { ReporteProyecto } from '../core/models';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
/*
      <div class="page-heading"><div><p class="eyebrow">TABLERO EJECUTIVO</p><h1>Reportes</h1><p class="muted">Resumen presupuestario y físico de la cartera municipal.</p></div></div>
      @if (error) { <div class="alert">{{ error }}</div> }
      @if (loading) { <section class="panel"><p class="muted pad">Cargando reporte…</p></section> } @else {
        <div class="detail-grid">
          <section class="panel span-two"><div class="panel-heading"><h2>Presupuesto total</h2></div><div class="pad"><strong>Bs {{ format(presupuestoTotal) }}</strong></div></section>
          <section class="panel"><div class="panel-heading"><h2>Total ejecutado</h2></div><div class="pad"><strong>Bs {{ format(ejecutadoTotal) }}</strong></div></section>
        </div>
        <section class="panel"><div class="panel-heading"><h2>Reporte por proyecto <span class="count">{{ reports.length }}</span></h2></div>
          @if (reports.length) { <div class="table-wrap"><table><thead><tr><th>Código</th><th>Proyecto</th><th>Estado</th><th>Presupuesto</th><th>Ejecutado</th><th>% ejecución</th></tr></thead><tbody>
            @for (report of reports; track report.id) { <tr><td class="table-sub">{{ report.codigo }}</td><td class="strong">{{ report.nombre }}</td><td><span class="status">{{ report.estado }}</span></td><td>Bs {{ format(report.presupuesto) }}</td><td>Bs {{ format(report.ejecutado) }}</td><td>{{ report.porcentajeEjecucion.toFixed(2) }}%</td></tr> }
          </tbody></table></div> } @else { <p class="muted pad">No hay información para reportar.</p> }
        </section>
      }
    </section>
  `,
})
*/
export class ReportsComponent implements OnInit {
  private readonly data = inject(DataService);
  reports: ReporteProyecto[] = [];
  loading = true;
  error = '';
  presupuestoTotal = 0;
  ejecutadoTotal = 0;
  ngOnInit(): void {
    this.data.reports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.presupuestoTotal = reports.reduce((total, report) => total + report.presupuesto, 0);
        this.ejecutadoTotal = reports.reduce((total, report) => total + report.ejecutado, 0);
        this.loading = false;
      },
      error: (e: { error?: { message?: string } }) => { this.error = e.error?.message ?? 'No se pudo cargar el reporte.'; this.loading = false; },
    });
  }
  format(value: number): string { return value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
}
