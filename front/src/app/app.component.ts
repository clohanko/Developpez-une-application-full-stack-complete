import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

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
  isAuthPage = false; // ⬅️ NEW

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Ping session (il faut souscrire)
    this.authService.checkSession().subscribe();

    // Suivre l'état de connexion
    this.authService.getLoginStatus().subscribe(status => {
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
