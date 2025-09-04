import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

const PASSWORD_REGEX =
  /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_\-*/?.,;:()\[\]{}<>]).{8,}$/;

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const pwd = control.get('password')?.value || '';
  const confirm = control.get('passwordConfirm')?.value || '';
  return pwd && confirm && pwd !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(PASSWORD_REGEX)]],
      passwordConfirm: ['', [Validators.required]]
    }, { validators: passwordMatch });
  }

  get f() { return this.registerForm.controls; }

  goBack(): void {
    this.router.navigateByUrl('/');
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const username = (this.f['username'].value as string).trim();
    const email = (this.f['email'].value as string).trim().toLowerCase();
    const password = this.f['password'].value as string;

    this.loading = true;
    this.authService.register({ username, email, password }).subscribe({
      next: (res) => {
        // Le back renvoie une chaîne "Utilisateur enregistré avec succès !"
        this.successMessage = typeof res === 'string' ? res : 'Inscription réussie.';
        this.loading = false;
        // Redirection vers le login (pas d’auto-login côté back)
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        // Message d’erreur cohérent qu’importe le format renvoyé
        const msg = (err?.error?.message ?? err?.error ?? err.statusText ?? '').toString();
        this.errorMessage = msg || 'Erreur lors de l’inscription';
        this.loading = false;
      }
    });
  }
}
