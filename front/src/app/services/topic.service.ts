import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface Topic {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class TopicService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  list(): Observable<Topic[]> {
    return this.http.get<Topic[]>(`${this.baseUrl}/topics`); // public
  }

  subscribe(topicId: number): Observable<string> {
    return this.http.post(`${this.baseUrl}/subscriptions/${topicId}`, {}, {
      withCredentials: true,
      responseType: 'text',
    });
  }

  unsubscribe(topicId: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/subscriptions/${topicId}`, {
      withCredentials: true,
      responseType: 'text',
    });
  }

  mySubscriptions(): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/subscriptions`, {
      withCredentials: true
    });
  }
}
