// src/app/services/post.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PostService, CreatePostPayload, PostDto, CommentDto } from './post.service';
import { environment } from 'src/environments/environment';

describe('PostService', () => {
  let svc: PostService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    svc = TestBed.inject(PostService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('create() should POST and return PostDto', () => {
    const payload: CreatePostPayload = { topicId: 1, title: 'Hello', content: 'World' };
    const mock: PostDto = {
      id: 123, topicId: 1, topicName: 'Angular',
      title: 'Hello', content: 'World',
      authorId: 9, authorUsername: 'seb',
      createdAt: '2025-08-16T10:00:00Z',
      comments: [],
    };

    svc.create(payload).subscribe(p => expect(p).toEqual(mock));

    const req = http.expectOne(`${environment.apiUrl}/posts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual(payload);
    req.flush(mock);
  });

  it('getOne() should GET by id', () => {
    const mock = { id: 7 } as PostDto;

    svc.getOne(7).subscribe(p => expect(p.id).toBe(7));

    const req = http.expectOne(`${environment.apiUrl}/posts/7`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('addComment() should POST comment', () => {
    const mock = { id: 1 } as CommentDto;

    svc.addComment(7, { content: 'yo' }).subscribe(c => expect(c.id).toBe(1));

    const req = http.expectOne(`${environment.apiUrl}/posts/7/comments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual({ content: 'yo' });
    req.flush(mock);
  });

  it('getFeed() should GET feed with query params', () => {
    const resp = { items: [], page: 0, size: 10, total: 0 };

    svc.getFeed('desc', 2, 5).subscribe(r => {
      // La réponse renvoyée par le serveur peut rester page=0,size=10.
      // On vérifie bien l’URL et on accepte le payload du serveur:
      expect(r).toEqual(resp);
    });

    // L’implémentation fait `${base.replace('/posts','')}/feed?...`
    const req = http.expectOne(r => r.url.includes(`${environment.apiUrl}`) && r.url.includes('/feed'));
    expect(req.request.method).toBe('GET');

    const url = new URL(req.request.urlWithParams);
    expect(url.searchParams.get('sort')).toBe('desc');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('size')).toBe('5');
    expect(req.request.withCredentials).toBeTrue();

    req.flush(resp);
  });
});
