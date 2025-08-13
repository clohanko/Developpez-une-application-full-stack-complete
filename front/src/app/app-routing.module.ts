// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { NewPostComponent } from './pages/posts/new-post.component';
import { PostDetailComponent } from './pages/posts/post-detail.component';

import { authGuard } from './guards/auth.guard';
import { authRedirectGuard } from './guards/auth-redirect.guard';

const routes: Routes = [
  // publiques
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent, canActivate: [authRedirectGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [authRedirectGuard] },

  // privées
  { path: 'me', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'posts/new', component: NewPostComponent, canActivate: [authGuard] }, // création = privé
  { path: 'posts/:id', component: PostDetailComponent },     

  // fallback
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
