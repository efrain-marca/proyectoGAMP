import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="login-card">
      <div class="login-emblem">P</div><p class="eyebrow">GOBIERNO AUTÓNOMO MUNICIPAL</p>
      <h1>Bienvenido</h1><p class="muted">Ingresa para continuar al sistema de proyectos.</p>
      @if (error) { <div class="alert">{{ error }}</div> }
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Correo electrónico<input type="email" formControlName="correo" placeholder="nombre@gamp.gob.bo"></label>
        @if (form.controls.correo.touched && form.controls.correo.invalid) { <small class="validation">Ingresa un correo válido.</small> }
        <label>Contraseña<input type="password" formControlName="password" placeholder="••••••••"></label>
        @if (form.controls.password.touched && form.controls.password.invalid) { <small class="validation">La contraseña debe tener al menos 8 caracteres.</small> }
        <button class="primary full" type="submit" [disabled]="loading">{{ loading ? 'Ingresando…' : 'Iniciar sesión' }}</button>
      </form>
      <p class="secure">Acceso institucional seguro</p>
    </section>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly form = this.fb.nonNullable.group({ correo: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]] });
  error = '';
  loading = false;
  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.error = '';
    this.loading = true;
    this.auth.login(this.form.getRawValue().correo, this.form.getRawValue().password).subscribe({
      next: () => { this.loading = false; void this.router.navigate(['/proyectos']); },
      error: (error: { error?: { message?: string } }) => { this.loading = false; this.error = error.error?.message ?? 'No se pudo iniciar sesión. Verifica los datos e inténtalo nuevamente.'; },
    });
  }
}
