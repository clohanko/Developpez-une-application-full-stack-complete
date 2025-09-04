import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

// Validator custom : accepte soit un email valide, soit un username (3–50, alphanum + . _ -)
function emailOrUsername(ctrl: AbstractControl): ValidationErrors | null {
  const v = (ctrl.value || '').trim();
  if (!v) return { required: true };

  const looksLikeEmail = v.includes('@');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRe = /^[a-zA-Z0-9._-]{3,50}$/;

  if (looksLikeEmail) return emailRe.test(v) ? null : { email: true };
  return usernameRe.test(v) ? null : { username: true };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [emailOrUsername]],
      password: ['', [Validators.required]],
    });
  }

  /** Transforme une HttpError en message utilisateur propre */
  private toUserMessage(err: HttpErrorResponse): string {
    const api = (err?.error ?? {}) as { message?: string };
    if (api?.message) return api.message;
    if (err.status === 401) return 'Identifiant ou mot de passe incorrect.';
    if (err.status === 403) return 'Accès refusé.';
    if (err.status === 404) return 'Ressource introuvable.';
    if (err.status === 0)   return 'Serveur indisponible.';
    return 'Une erreur est survenue.';
  }

  /** Efface uniquement l’erreur "api" sur chaque contrôle (sans toucher aux autres validators) */
  private clearApiErrors(): void {
    Object.values(this.loginForm.controls).forEach(ctrl => {
      const errs = ctrl.errors;
      if (errs && Object.prototype.hasOwnProperty.call(errs, 'api')) {
        const { api, ...rest } = errs as any;
        ctrl.setErrors(Object.keys(rest).length ? rest : null);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.loading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.error = null;
    this.loading = true;
    this.clearApiErrors(); // supprime les anciens messages "api"

    // Email en lowercase uniquement si c’en est un ; sinon on garde la casse du username
    const rawIdentifier = String(this.loginForm.value.email || '').trim();
    const identifier = rawIdentifier.includes('@') ? rawIdentifier.toLowerCase() : rawIdentifier;
    const password = String(this.loginForm.value.password || '');

    this.authService.login({ email: identifier, password }).subscribe({
      next: () => {
        this.loading = false;
        this.authService.updateLoginStatus();
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;

        // 1) message global propre
        this.error = this.toUserMessage(err);

        // 2) erreurs de champs éventuelles renvoyées par le back (validation @Valid)
        const fieldErrors = (err?.error?.fieldErrors ?? {}) as Record<string, string>;
        Object.entries(fieldErrors).forEach(([field, message]) => {
          const ctrl = this.loginForm.get(field);
          if (ctrl) {
            const current = ctrl.errors || {};
            ctrl.setErrors({ ...current, api: message });
            ctrl.markAsTouched();
          }
        });
      },
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/');
  }
}
