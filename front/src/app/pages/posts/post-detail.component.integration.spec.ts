import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { PostDetailComponent } from './post-detail.component';
import { PostDto } from 'src/app/services/post.service';
import { AuthService } from 'src/app/services/auth.service';

describe('PostDetailComponent (integration HttpClient)', () => {
  const post: PostDto = {
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

  function setup() {
    const authStub = { getLoginStatus: () => of(true) } as Partial<AuthService>;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        PostDetailComponent, // standalone: template réel
      ],
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      ],
    }).compileComponents();

    const httpMock = TestBed.inject(HttpTestingController);

    const fixture = TestBed.createComponent(PostDetailComponent);
    const comp = fixture.componentInstance;

    // ngOnInit déclenché
    fixture.detectChanges();

    return { fixture, comp, httpMock };
  }

  afterEach(() => {
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.verify();
  });

  it('ngOnInit charge le post via GET, puis submit ajoute un commentaire via POST', () => {
    const { fixture, comp, httpMock } = setup();

    // --- GET /posts/7 ---
    const getReq = httpMock.expectOne(req => req.method === 'GET' && req.url.endsWith('/posts/7'));
    expect(getReq.request.withCredentials).toBeFalse(); // selon ton service, ajuste si besoin
    getReq.flush(post);
    fixture.detectChanges();

    // état après GET
    expect(comp.loading).toBeFalse();
    expect(comp.post?.id).toBe(7);

    // Renseigner le formulaire puis soumettre
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input, textarea, [formcontrolname="content"]') 
      ?? fixture.nativeElement.querySelector('input[formControlName="content"]');
    input.value = 'Mon commentaire';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    // --- POST /posts/7/comments ---
    const postReq = httpMock.expectOne(req =>
      req.method === 'POST' && /\/posts\/7\/comments$/.test(req.url)
    );
    expect(postReq.request.body).toEqual({ content: 'Mon commentaire' });
    postReq.flush({
      id: 1, authorId: 1, authorUsername: 'alice', content: 'Mon commentaire', createdAt: 'now'
    });
    fixture.detectChanges();

    // État mis à jour par le composant
    expect(comp.post?.comments.length).toBe(1);
    expect(comp.commentForm.value.content).toBeNull(); // reset()
    expect((comp as any).sending).toBeFalse();
  });

  it('GET en erreur affiche le message et stoppe le loading', () => {
    const { comp, httpMock } = setup();

    const getReq = httpMock.expectOne(req => req.method === 'GET' && req.url.endsWith('/posts/7'));
    getReq.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

    expect(comp.loading).toBeFalse();
    expect(comp.errorMsg).toBe('Article introuvable.');
  });

  it('POST commentaire en erreur remet sending=false', () => {
    const { fixture, comp, httpMock } = setup();

    // GET OK
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/posts/7')).flush(post);
    fixture.detectChanges();

    // Prépare form et soumets
    comp.commentForm.setValue({ content: 'oops' });
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('form') as HTMLFormElement)
      .dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    // POST KO
    httpMock.expectOne(r => r.method === 'POST' && /\/posts\/7\/comments$/.test(r.url))
      .flush({ message: 'KO' }, { status: 500, statusText: 'Server Error' });

    expect((comp as any).sending).toBeFalse();
  });
});
