// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface UpdateUserPayload {
  email: string;
  username: string;
}

export interface UpdatePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  /** Récupère l'utilisateur courant */
  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`, { withCredentials: true });
  }

  /** Met à jour email/username (correspond à PUT /api/user/me) */
  updateMe(payload: UpdateUserPayload): Observable<string> {
    return this.http.put(`${this.apiUrl}/me`, payload, {
      withCredentials: true,
      responseType: 'text',
    });
  }

  /** Change le mot de passe (PUT /api/user/me/password) */
  updatePassword(payload: UpdatePasswordPayload): Observable<string> {
    return this.http.put(`${this.apiUrl}/me/password`, payload, {
      withCredentials: true,
      responseType: 'text',
    });
  }
}
