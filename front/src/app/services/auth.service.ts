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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private loggedIn = new BehaviorSubject<boolean>(this.hasTokenCookie());

  constructor(private http: HttpClient) {
    this.checkSession()
      .pipe(catchError(() => of(false)))
      .subscribe();
  }

  /** ---- AUTH FLOWS ---- */

  login(credentials: LoginCredentials): Observable<string> {
    const payload = {
      email: (credentials.email || '').trim().toLowerCase(),
      password: credentials.password
    };
    return this.http.post(`${this.apiUrl}/login`, payload, {
      withCredentials: true,
      responseType: 'text',
    }).pipe(
      tap(() => this.loggedIn.next(true))
    );
  }

  register(data: RegisterPayload): Observable<string> {
    const payload = {
      username: (data.username || '').trim(),
      email: (data.email || '').trim().toLowerCase(),
      password: data.password
    };
    return this.http.post(`${this.apiUrl}/register`, payload, {
      withCredentials: true,
      responseType: 'text',
    });
    // ⬆️ on NE met PAS loggedIn à true ici : pas d’auto-login côté back
  }

  logout(): void {
    this.logoutFromServer().subscribe({
      next: () => {
        this.loggedIn.next(false);
        document.cookie = 'jwt=; Max-Age=0; path=/';
        document.cookie = 'token=; Max-Age=0; path=/';
      },
      error: () => {
        this.loggedIn.next(false);
        document.cookie = 'jwt=; Max-Age=0; path=/';
        document.cookie = 'token=; Max-Age=0; path=/';
      }
    });
  }

  /** ---- STATE API POUR LA NAVBAR/GUARDS ---- */

  isLoggedIn(): boolean {
    return this.loggedIn.value;
  }

  getLoginStatus(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  updateLoginStatus(): void {
    this.checkSession()
      .pipe(catchError(() => of(false)))
      .subscribe();
  }

  checkSession(): Observable<boolean> {
    return this.http.get(`${environment.apiUrl}/user/me`, { withCredentials: true }).pipe(
      map(() => true),
      catchError(() => of(false)),
      tap(ok => this.loggedIn.next(ok))
    );
  }

  /** ---- UTILS ---- */

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
