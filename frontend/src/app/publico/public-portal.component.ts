import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data.service';
import { PublicProject, PublicStatistics } from '../core/models';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './public-portal.component.html',
  styleUrls: ['./public-portal.component.css'],
})
export class PublicPortalComponent implements OnInit {
  private readonly data = inject(DataService);
  private readonly fb = inject(FormBuilder);

  readonly filters = this.fb.nonNullable.group({ busqueda: '', estado: '' });
  projects: PublicProject[] = [];
  statistics: PublicStatistics | null = null;
  loading = true;
  error = '';

  ngOnInit(): void {
    this.data.publicStatistics().subscribe({
      next: (value) => { this.statistics = value; },
      error: () => { this.statistics = null; },
    });
    this.search();
  }

  search(): void {
    this.loading = true;
    const value = this.filters.getRawValue();
    this.data.publicProjects({ busqueda: value.busqueda, estado: value.estado, limit: '12' }).subscribe({
      next: (result) => { this.projects = result.items; this.loading = false; },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message ?? 'No se pudieron cargar las obras publicadas.';
        this.loading = false;
      },
    });
  }

  absoluteUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
  }
}
