import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../core/data.service';
import { PublicProject } from '../core/models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-project.component.html',
  styleUrls: ['./public-project.component.css'],
})
/*
      <header class="public-header"><div class="public-brand"><span class="seal">P</span><div><strong>Gobierno Autónomo Municipal de Potosí</strong><small>Portal de Transparencia</small></div></div><a routerLink="/publico" class="public-login">Todas las obras</a></header>
      <section class="public-content">
        @if (error) { <div class="alert">{{ error }}</div> } @else if (project) {
          <a routerLink="/publico" class="text-button">← Volver al portal</a>
          <section class="public-detail-header"><div><p class="eyebrow">{{ project.codigo }}</p><h1>{{ project.nombre }}</h1><p>{{ project.ubicacion }}</p></div><span class="status">{{ project.estado }}</span></section>
          <div class="public-detail-grid">
            <article class="panel"><div class="panel-heading"><h2>Información general</h2></div><div class="pad"><p>{{ project.descripcion || 'Sin descripción publicada.' }}</p><p><strong>Distrito:</strong> {{ project.distrito || 'No publicado' }}</p><p><strong>Comunidad:</strong> {{ project.comunidad || 'No publicado' }}</p><p><strong>Inicio:</strong> {{ project.fechaInicio | date:'dd/MM/yyyy' }}</p><p><strong>Conclusión prevista:</strong> {{ project.fechaFin | date:'dd/MM/yyyy' }}</p></div></article>
            <article class="panel"><div class="panel-heading"><h2>Avance físico</h2></div><div class="pad"><strong class="public-big">{{ project.avanceFisico }}%</strong><div class="public-progress"><div [style.width.%]="project.avanceFisico"></div></div></div></article>
            <article class="panel span-two"><div class="panel-heading"><h2>Galería pública</h2></div><div class="pad">@if (photos.length) { @for (photo of photos; track photo.id) { <div><strong>{{ photo.nombre }}</strong><small>{{ photo.fecha | date:'dd/MM/yyyy' }}</small></div> } } @else { <p class="muted">Las fotografías autorizadas aparecerán aquí.</p> }</div></article>
            <article class="panel span-two"><div class="panel-heading"><h2>Cronograma de actividades</h2></div>
              @if (activities.length) { <div class="table-wrap"><table><thead><tr><th>Actividad</th><th>Inicio</th><th>Fin</th><th>Avance</th><th>Estado</th></tr></thead><tbody>@for (activity of activities; track activity.id) { <tr><td>{{ activity.nombre }}</td><td>{{ activity.fechaInicio | date:'dd/MM/yyyy' }}</td><td>{{ activity.fechaFin | date:'dd/MM/yyyy' }}</td><td>{{ Number(activity.avance).toFixed(2) }}%</td><td>{{ activity.estado }}</td></tr> }</tbody></table></div> } @else { <p class="muted pad">Cronograma pendiente de publicación.</p> }
            </article>
          </div>
        } @else { <p class="muted pad">Cargando ficha pública…</p> }
      </section>
    </main>
  `,
})
*/
export class PublicProjectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(DataService);
  readonly Number = Number;
  project: (PublicProject & Record<string, unknown>) | null = null;
  activities: { id: number; nombre: string; fechaInicio: string; fechaFin: string; avance: number | string; estado: string }[] = [];
  photos: { id: number; nombre: string; ruta: string; fecha: string }[] = [];
  error = '';
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.data.publicProject(id).subscribe({
      next: (project) => { this.project = project; this.activities = (project['cronograma'] as typeof this.activities) ?? []; this.photos = (project['galeria'] as typeof this.photos) ?? []; },
      error: (error: { error?: { message?: string } }) => { this.error = error.error?.message ?? 'No se pudo cargar la obra pública.'; },
    });
  }
}
