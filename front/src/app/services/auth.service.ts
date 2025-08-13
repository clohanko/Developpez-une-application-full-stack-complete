// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, BehaviorSubject, of, map, catchError, tap } from 'rxjs';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  // Valeur initiale = heuristique (dev non-HttpOnly). L'état fiable vient de checkSession().
  private loggedIn = new BehaviorSubject<boolean>(this.hasTokenCookie());

  constructor(private http: HttpClient) {
    // Synchronise l'état dès le démarrage de l'app (utile après F5).
    this.checkSession().subscribe();
  }

  /** ---- AUTH FLOWS ---- */

  login(credentials: LoginCredentials): Observable<string> {
    return this.http.post(`${this.apiUrl}/login`, credentials, {
      withCredentials: true,
      responseType: 'text',
    }).pipe(
      tap(() => this.loggedIn.next(true))
    );
  }

  // Supprimer les any -> typé via RegisterPayload + Observable<string>
  register(data: RegisterPayload): Observable<string> {
    return this.http.post(`${this.apiUrl}/register`, data, {
      withCredentials: true,
      responseType: 'text',
    }).pipe(
      tap(() => this.loggedIn.next(true))
    );
  }

  logout(): void {
    this.logoutFromServer().subscribe(() => {
      this.loggedIn.next(false);
      // Optionnel : purge d'un éventuel cookie non HttpOnly en dev
      // (le cookie HttpOnly est invalidé côté serveur).
      document.cookie = 'jwt=; Max-Age=0; path=/';
      document.cookie = 'token=; Max-Age=0; path=/';
    });
  }

  /** ---- STATE API POUR LA NAVBAR/GUARDS ---- */

  isLoggedIn(): boolean {
    return this.loggedIn.value;
  }

  getLoginStatus(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  // Au lieu de lire document.cookie, on demande au serveur.
  updateLoginStatus(): void {
    this.checkSession().subscribe();
  }

  /**
   * Ping /user/me pour savoir si la session est valide.
   * Met à jour loggedIn et renvoie true/false.
   */
  checkSession() {
    return this.http.get(`${environment.apiUrl}/user/me`, { withCredentials: true }).pipe(
      map(() => true),
      catchError(() => of(false)),
      tap(ok => this.loggedIn.next(ok))
    );
  }

  /** ---- UTILS ---- */

  // Heuristique uniquement utile si tu n'utilises PAS HttpOnly en dev.
  // Ajuste le nom du cookie si besoin (jwt vs token).
  private hasTokenCookie(): boolean {
    return /(?:^|;\s*)(jwt|token)=/.test(document.cookie);
  }

  logoutFromServer(): Observable<string> {
    return this.http.post(`${this.apiUrl}/logout`, {}, {
      withCredentials: true,
      responseType: 'text'
    });
  }
}
