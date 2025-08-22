// src/app/services/post.service.integration.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PostService, CreatePostPayload, PostDto } from './post.service';

describe('PostService (integration HttpClient)', () => {
  let svc: PostService;
  let http: HttpTestingController;

  const postSample: PostDto = {
    id: 7,
    topicId: 1,
    topicName: 'Angular',
    title: 'Titre',
    content: 'Contenu',
    authorId: 1,
    authorUsername: 'alice',
    createdAt: '2025-01-01',
    comments: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PostService],
    });
    svc = TestBed.inject(PostService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  // ---- getFeed: branche 1 = paramètres par défaut (page=0, size=10) ----
  it('getFeed() avec valeurs par défaut -> sort=desc&page=0&size=10 (withCredentials=true)', () => {
    let res: any;
    svc.getFeed('desc').subscribe(r => (res = r));

    const req = http.expectOne(r => {
      const url = r.urlWithParams || r.url;
      return (
        r.method === 'GET' &&
        /\/feed(?:\?|$)/.test(url) &&
        url.includes('sort=desc') &&
        url.includes('page=0') &&
        url.includes('size=10')
      );
    });
    expect(req.request.withCredentials).toBeTrue();

    req.flush({ items: [postSample], page: 0, size: 10, total: 1 });
    expect(res.items.length).toBe(1);
    expect(res.page).toBe(0);
    expect(res.size).toBe(10);
  });

  // ---- getFeed: branche 2 = paramètres explicites (autres valeurs) ----
  it('getFeed() avec paramètres explicites -> sort=asc&page=2&size=5 (withCredentials=true)', () => {
    svc.getFeed('asc', 2, 5).subscribe();

    const req = http.expectOne(r => {
      const url = r.urlWithParams || r.url;
      return (
        r.method === 'GET' &&
        /\/feed(?:\?|$)/.test(url) &&
        url.includes('sort=asc') &&
        url.includes('page=2') &&
        url.includes('size=5')
      );
    });
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ items: [], page: 2, size: 5, total: 0 });
  });

  it('create() POST /posts avec payload (withCredentials=true)', () => {
    const payload: CreatePostPayload = { topicId: 1, title: 'T', content: 'C' };
    let res: PostDto | undefined;
    svc.create(payload).subscribe(r => (res = r));

    const req = http.expectOne(r => r.method === 'POST' && /\/posts$/.test(r.url));
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual(payload);

    req.flush({ ...postSample, id: 123 });
    expect(res?.id).toBe(123);
  });

  it('getOne() GET /posts/:id (withCredentials par défaut = false)', () => {
    let res: PostDto | undefined;
    svc.getOne(7).subscribe(r => (res = r));

    const req = http.expectOne(r => r.method === 'GET' && /\/posts\/7$/.test(r.url));
    expect(req.request.withCredentials).toBeFalse(); // non spécifié dans le service
    req.flush(postSample);
    expect(res?.id).toBe(7);
  });

  it('addComment() POST /posts/:id/comments (withCredentials=true)', () => {
    svc.addComment(7, { content: 'hello' }).subscribe();

    const req = http.expectOne(r => r.method === 'POST' && /\/posts\/7\/comments$/.test(r.url));
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual({ content: 'hello' });

    req.flush({ id: 1, authorId: 1, authorUsername: 'alice', content: 'hello', createdAt: 'now' });
  });
});
