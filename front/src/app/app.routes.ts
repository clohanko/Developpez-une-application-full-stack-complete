// src/app/app.routes.ts
import { Routes } from '@angular/router';

import { HomeComponent }     from './pages/home/home.component';
import { LoginComponent }    from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent }  from './pages/profile/profile.component';
import { TopicsComponent } from './pages/topics/topics.component';
import { NewPostComponent } from './pages/posts/new-post.component';     
import { PostDetailComponent } from './pages/posts/post-detail.component';

import { authGuard }         from './guards/auth.guard';
import { authRedirectGuard } from './guards/auth-redirect.guard';


export const APP_ROUTES: Routes = [
  // publiques
  { path: '',         component: HomeComponent },
  { path: 'login',    component: LoginComponent,    canActivate: [authRedirectGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [authRedirectGuard] },
  { path: 'topics', component: TopicsComponent }, 
  { path: 'posts/new', component: NewPostComponent, canActivate: [authGuard] }, 
  { path: 'posts/:id', component: PostDetailComponent },    

  // privées
  { path: 'me',       component: ProfileComponent,  canActivate: [authGuard] },

  // fallback
  { path: '**', redirectTo: '' },
];
