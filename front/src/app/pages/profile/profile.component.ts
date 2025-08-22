import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors,
  FormGroup, FormControl
} from '@angular/forms';
import { Router } from '@angular/router';
import { take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { UserService, UpdateUserPayload, UpdatePasswordPayload, MeDto } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { TopicService, Topic } from 'src/app/services/topic.service';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const pwd  = group.get('newPassword')?.value;
  const conf = group.get('confirmNewPassword')?.value;
  return pwd && conf && pwd !== conf ? { passwordMismatch: true } : null;
}

type ProfileForm = FormGroup<{
  email:    FormControl<string>;
  username: FormControl<string>;
}>;

type PasswordForm = FormGroup<{
  oldPassword:        FormControl<string>;
  newPassword:        FormControl<string>;
  confirmNewPassword: FormControl<string>;
}>;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  user: MeDto | null = null;

  /** Tous les topics (pour mapper les IDs -> objets) */
  private allTopics: Topic[] = [];

  /** Topics auxquels l’utilisateur est abonné (affichage) */
  subscriptions: Topic[] = [];

  /** Gestion d’état pour les boutons de désabonnement */
  loadingIds = new Set<number>();

  // ------ Forms ------
  profileForm: ProfileForm = this.fb.group({
    email:    this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    username: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
  });

  passwordForm: PasswordForm = this.fb.nonNullable.group({
    oldPassword:        this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    newPassword:        this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    confirmNewPassword: this.fb.nonNullable.control('', [Validators.required]),
  }, { validators: matchPasswords });

  // UI
  loadingProfile = false;
  loadingPassword = false;
  msgProfile:  { type: 'success'|'error'; text: string } | null = null;
  msgPassword: { type: 'success'|'error'; text: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private auth: AuthService,
    private topics: TopicService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1) Ping session (avec gestion d’erreur)
    this.auth.checkSession().pipe(
      take(1),
      catchError(() => of(false))
    ).subscribe(ok => {
      if (!ok) {
        this.router.navigateByUrl('/login');
        return;
      }

      // 2) Charger les infos utilisateur (pour remplir le formulaire)
      this.userService.getCurrentUser().pipe(take(1)).subscribe({
        next: (data) => {
          this.user = data;
          this.profileForm.patchValue({
            email: data.email,
            username: data.username,
          });
        },
        error: () => this.router.navigateByUrl('/login'),
      });

      // 3) Charger tous les topics puis mes abonnements
      this.topics.list().pipe(take(1)).subscribe({
        next: (all) => {
          this.allTopics = all;
          this.refreshMySubscriptions(); // mappe les IDs -> objets
        },
        error: () => {
          this.allTopics = [];
          this.subscriptions = [];
        }
      });
    });
  }

  /** Récupère /api/subscriptions (number[]) puis remplit this.subscriptions avec les objets Topic */
  private refreshMySubscriptions(): void {
    this.topics.mySubscriptions().pipe(take(1)).subscribe({
      next: (ids: number[]) => {
        const idSet = new Set(ids.map(Number));
        this.subscriptions = this.allTopics.filter(t => idSet.has(Number(t.id)));
      },
      error: () => { this.subscriptions = []; }
    });
  }

  // Helpers template
  get f() { return this.profileForm.controls; }
  get p() { return this.passwordForm.controls; }

  // ------ Profil ------
  submitProfile(): void {
    this.msgProfile = null;
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const payload: UpdateUserPayload = this.profileForm.getRawValue();
    this.loadingProfile = true;
    this.userService.updateMe(payload).pipe(take(1)).subscribe({
      next: () => {
        this.msgProfile = { type: 'success', text: 'Profil mis à jour.' };
        this.loadingProfile = false;
        this.user = this.user
          ? { ...this.user, ...payload }
          : { username: payload.username, email: payload.email };
      },
      error: () => {
        this.msgProfile = { type: 'error', text: 'Échec de la mise à jour.' };
        this.loadingProfile = false;
      }
    });
  }

  // ------ Mot de passe ------
  submitPassword(): void {
    this.msgPassword = null;
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { oldPassword, newPassword } = this.passwordForm.getRawValue();
    const payload: UpdatePasswordPayload = { oldPassword, newPassword };

    this.loadingPassword = true;
    this.userService.updatePassword(payload).pipe(take(1)).subscribe({
      next: () => {
        this.msgPassword = { type: 'success', text: 'Mot de passe mis à jour.' };
        this.loadingPassword = false;
        this.passwordForm.reset({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      },
      error: () => {
        this.msgPassword = { type: 'error', text: 'Échec du changement de mot de passe.' };
        this.loadingPassword = false;
      }
    });
  }

  // ------ Abonnements ------
  onUnsubscribe(topicId: number): void {
    if (this.loadingIds.has(topicId)) return;
    this.loadingIds.add(topicId);

    this.topics.unsubscribe(topicId).pipe(take(1)).subscribe({
      next: () => {
        this.subscriptions = this.subscriptions.filter(t => Number(t.id) !== Number(topicId));
        this.loadingIds.delete(topicId);
      },
      error: () => {
        this.loadingIds.delete(topicId);
      }
    });
  }
}
