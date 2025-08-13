import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { UserService, UpdateUserPayload, UpdatePasswordPayload } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { TopicService, Topic } from 'src/app/services/topic.service';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const pwd  = group.get('newPassword')?.value;
  const conf = group.get('confirmNewPassword')?.value;
  return pwd && conf && pwd !== conf ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  user: any;

  /** Tous les topics (pour mapper les IDs -> objets) */
  private allTopics: Topic[] = [];

  /** Topics auxquels l’utilisateur est abonné (affichage) */
  subscriptions: Topic[] = [];

  /** Gestion d’état pour les boutons de désabonnement */
  loadingIds = new Set<number>();

  // ------ Forms ------
  profileForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(2)]],
  });

  passwordForm = this.fb.group({
    oldPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmNewPassword: ['', [Validators.required]],
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
    // 1) Ping session
    this.auth.checkSession().pipe(take(1)).subscribe(ok => {
      if (!ok) {
        this.router.navigateByUrl('/login');
        return;
      }

      // 2) Charger les infos utilisateur (pour remplir le formulaire)
      this.userService.getCurrentUser().pipe(take(1)).subscribe({
        next: (data) => {
          this.user = data;
          this.profileForm.patchValue({
            email: data?.email ?? '',
            username: data?.username ?? '',
          });
        },
        error: () => this.router.navigateByUrl('/login'),
      });

      // 3) Charger tous les topics puis mes abonnements (même logique que TopicsComponent)
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
    const payload: UpdateUserPayload = this.profileForm.value as UpdateUserPayload;
    this.loadingProfile = true;
    this.userService.updateMe(payload).pipe(take(1)).subscribe({
      next: () => {
        this.msgProfile = { type: 'success', text: 'Profil mis à jour.' };
        this.loadingProfile = false;
        this.user = { ...this.user, ...payload };
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
    const payload: UpdatePasswordPayload = {
      oldPassword: this.passwordForm.value.oldPassword!,
      newPassword: this.passwordForm.value.newPassword!,
    };
    this.loadingPassword = true;
    this.userService.updatePassword(payload).pipe(take(1)).subscribe({
      next: () => {
        this.msgPassword = { type: 'success', text: 'Mot de passe mis à jour.' };
        this.loadingPassword = false;
        this.passwordForm.reset();
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
        // Retire localement + garde l’UI réactive
        this.subscriptions = this.subscriptions.filter(t => Number(t.id) !== Number(topicId));
        this.loadingIds.delete(topicId);
      },
      error: () => {
        this.loadingIds.delete(topicId);
      }
    });
  }
}
