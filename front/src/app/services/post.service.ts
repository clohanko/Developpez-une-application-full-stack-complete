// src/app/services/post.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface CreatePostPayload { topicId: number; title: string; content: string; }
export interface CreateCommentPayload { content: string; }

export interface CommentDto {
  id: number; authorId: number; authorUsername: string;
  content: string; createdAt: string;
}
export interface PostDto {
  id: number;
  topicId: number; topicName: string;
  title: string; content: string;
  authorId: number; authorUsername: string;
  createdAt: string;
  comments: CommentDto[];
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private base = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) {}

  create(payload: CreatePostPayload): Observable<PostDto> {
    return this.http.post<PostDto>(this.base, payload, { withCredentials: true });
  }

  getOne(id: number): Observable<PostDto> {
    return this.http.get<PostDto>(`${this.base}/${id}`);
  }

  addComment(id: number, payload: CreateCommentPayload): Observable<CommentDto> {
    return this.http.post<CommentDto>(`${this.base}/${id}/comments`, payload, { withCredentials: true });
  }

  getFeed(sort: 'asc'|'desc', page = 0, size = 10) {
    const params = new URLSearchParams({ sort, page: String(page), size: String(size) });
    return this.http.get<{ items: PostDto[]; page: number; size: number; total: number; }>(
      `${this.base.replace('/posts','')}/feed?${params.toString()}`,
      { withCredentials: true }
    );
  }
}

