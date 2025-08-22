import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService } from './services/auth.service';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  isLogged = false;
  isHomePage = false;
  isAuthPage = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Ping session (protégé contre les erreurs réseau)
    this.authService.checkSession()
      .pipe(catchError(() => of(false)))
      .subscribe();

    // Suivre l'état de connexion (fallback à false en cas d’erreur)
    this.authService.getLoginStatus()
      .pipe(catchError(() => of(false)))
      .subscribe(status => {
        this.isLogged = status;
      });

    const computeFlags = (url: string | undefined) => {
      const u = url ?? '';
      this.isHomePage = (u === '/' || u === '');
      this.isAuthPage = u.startsWith('/login') || u.startsWith('/register');
    };

    // Valeur initiale
    computeFlags(this.router.url);

    // Mettre à jour à chaque navigation
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => computeFlags(e.urlAfterRedirects));
  }
}
