import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../core/data.service';
import { Usuario } from '../core/models';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <div class="page-heading"><div><p class="eyebrow">ADMINISTRACIÓN</p><h1>Gestión de usuarios</h1><p class="muted">Administra las cuentas y niveles de acceso del sistema.</p></div><button class="primary" (click)="startNew()">+ Nuevo usuario</button></div>
      @if (error) { <div class="alert">{{ error }}</div> }
      @if (editing) {
        <section class="panel form-panel"><div class="panel-heading"><h2>{{ editing.id ? 'Editar usuario' : 'Registrar usuario' }}</h2><button class="text-button" (click)="cancel()">Cancelar</button></div>
          <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
            <label>Nombre completo<input formControlName="nombre"></label><label>Correo electrónico<input type="email" formControlName="correo"></label>
            @if (!editing.id) { <label>Contraseña<input type="password" formControlName="password" autocomplete="new-password"></label> }
            <label>Rol<select formControlName="rol"><option value="ADMINISTRADOR">Administrador</option><option value="SUPERVISOR">Supervisor</option><option value="TECNICO">Técnico</option><option value="CONSULTA">Consulta</option></select></label>
            @if (editing.id) { <label>Estado<select formControlName="activo"><option [ngValue]="true">Activo</option><option [ngValue]="false">Inactivo</option></select></label> }
            <div class="form-actions"><button class="primary" type="submit" [disabled]="saving">{{ saving ? 'Guardando…' : 'Guardar usuario' }}</button></div>
          </form>
        </section>
      }
      <section class="panel"><div class="panel-heading"><h2>Usuarios registrados <span class="count">{{ users.length }}</span></h2></div>
        @if (loading) { <p class="muted pad">Cargando usuarios…</p> }
        @else if (users.length) {
          <div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr></thead><tbody>
            @for (user of users; track user.id) { <tr><td class="strong">{{ user.nombre }}</td><td>{{ user.correo }}</td><td><span class="role">{{ user.rol }}</span></td><td><span class="status" [class.inactive]="!user.activo">{{ user.activo ? 'Activo' : 'Inactivo' }}</span></td><td><button class="text-button" (click)="edit(user)">Editar</button></td></tr> }
          </tbody></table></div>
        } @else { <p class="muted pad">No hay usuarios registrados.</p> }
      </section>
    </section>
  `,
})
export class UsersComponent implements OnInit {
  private readonly data = inject(DataService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({ nombre: ['', Validators.required], correo: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]], rol: ['CONSULTA'], activo: [true] });
  users: Usuario[] = [];
  editing: Usuario | null = null;
  error = '';
  loading = true;
  saving = false;
  ngOnInit(): void { this.load(); }
  load(): void { this.loading = true; this.data.users().subscribe({ next: (users) => { this.users = users; this.loading = false; }, error: () => { this.error = 'No se pudieron cargar usuarios. Verifica tus permisos o la conexión.'; this.loading = false; } }); }
  startNew(): void { this.editing = { id: 0, nombre: '', correo: '', rol: 'CONSULTA', activo: true }; this.form.reset({ nombre: '', correo: '', password: '', rol: 'CONSULTA', activo: true }); this.form.controls.password.addValidators([Validators.required, Validators.minLength(8)]); }
  edit(user: Usuario): void { this.editing = user; this.form.controls.password.clearValidators(); this.form.reset({ nombre: user.nombre, correo: user.correo, password: '', rol: user.rol, activo: user.activo }); }
  cancel(): void { this.editing = null; this.error = ''; }
  save(): void {
    this.form.markAllAsTouched();
    if (!this.editing || this.form.invalid) return;
    this.saving = true; this.error = '';
    const values = this.form.getRawValue();
    const request = this.editing.id ? this.data.updateUser(this.editing.id, { nombre: values.nombre, correo: values.correo, rol: values.rol, activo: values.activo }) :
      this.data.createUser({ nombre: values.nombre, correo: values.correo, password: values.password, rol: values.rol });
    request.subscribe({ next: () => { this.saving = false; this.editing = null; this.load(); }, error: (e: { error?: { message?: string } }) => { this.saving = false; this.error = e.error?.message ?? 'No se pudo guardar el usuario.'; } });
  }
}
