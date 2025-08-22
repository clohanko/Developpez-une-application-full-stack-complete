import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PostDetailComponent } from './post-detail.component';
import { PostService, PostDto } from 'src/app/services/post.service';
import { AuthService } from 'src/app/services/auth.service';

describe('PostDetailComponent (branches + shallow integration)', () => {
  const basePost: PostDto = {
    id: 7,
    topicId: 1,
    topicName: 'Angular',
    title: 'T',
    content: 'C',
    authorId: 1,
    authorUsername: 'u',
    createdAt: '2025-01-01',
    comments: [],
  };

  /** Setup pour tests de logique (template stub ultra simple) */
  function setupLogic(opts?: {
    loginStatus?: 'ok' | 'error';
    getOne?: 'ok' | 'error';
    addCommentMode?: 'ok' | 'error';
    postOverride?: Partial<PostDto>;
  }) {
    const loginStatus = opts?.loginStatus ?? 'ok';
    const getOne = opts?.getOne ?? 'ok';
    const addCommentMode = opts?.addCommentMode ?? 'ok';
    const post: PostDto = { ...basePost, ...(opts?.postOverride ?? {}) };

    const authSvc = {
      getLoginStatus: jasmine
        .createSpy('getLoginStatus')
        .and.returnValue(loginStatus === 'ok' ? of(true) : throwError(() => new Error('auth-err'))),
    } as unknown as AuthService;

    const postSvc = {
      getOne: jasmine
        .createSpy('getOne')
        .and.returnValue(getOne === 'ok' ? of(post) : throwError(() => new Error('nf'))),
      addComment: jasmine
        .createSpy('addComment')
        .and.returnValue(
          addCommentMode === 'ok'
            ? of({ id: 1, authorId: 1, authorUsername: 'u', content: 'ok', createdAt: 'now' })
            : throwError(() => new Error('add-err'))
        ),
    } as unknown as PostService;

    const router = {
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)),
    } as unknown as Router;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, PostDetailComponent],
      providers: [
        { provide: AuthService, useValue: authSvc },
        { provide: PostService, useValue: postSvc },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      ],
    })
      // on stub le template pour isoler la logique TS
      .overrideComponent(PostDetailComponent, { set: { template: '<div>stub</div>' } })
      .compileComponents();

    const fixture = TestBed.createComponent(PostDetailComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit()

    return { fixture, comp, authSvc, postSvc, router };
  }

  /** Setup avec un mini-formulaire (ngSubmit) pour un test d’intégration léger */
  function setupWithForm() {
    const authSvc = {
      getLoginStatus: jasmine.createSpy('getLoginStatus').and.returnValue(of(true)),
    } as unknown as AuthService;

    const postSvc = {
      getOne: jasmine.createSpy('getOne').and.returnValue(of(basePost)),
      addComment: jasmine
        .createSpy('addComment')
        .and.returnValue(of({ id: 1, authorId: 1, authorUsername: 'u', content: 'yo', createdAt: 'now' })),
    } as unknown as PostService;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, PostDetailComponent],
      providers: [
        { provide: AuthService, useValue: authSvc },
        { provide: PostService, useValue: postSvc },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      ],
    })
      // mini template: un formulaire qui déclenche addComment()
      .overrideComponent(PostDetailComponent, {
        set: {
          template: `
            <form [formGroup]="commentForm" (ngSubmit)="addComment()">
              <input formControlName="content" />
              <button type="submit">Send</button>
            </form>
          `,
        },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(PostDetailComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    return { fixture, comp, postSvc };
  }

  // --------- ngOnInit branches ----------
  it('loginStatus en erreur -> isLogged=false (catchError appliqué)', () => {
    const { comp } = setupLogic({ loginStatus: 'error' });
    expect(comp.isLogged).toBeFalse();
  });

  it('getOne en erreur -> message et loading=false', () => {
    const { comp, postSvc } = setupLogic({ getOne: 'error' });
    expect(postSvc.getOne).toHaveBeenCalledWith(7);
    expect(comp.errorMsg).toBe('Article introuvable.');
    expect(comp.loading).toBeFalse();
  });

  // --------- goBack branches ----------
  it('goBack avec history.length>1 appelle history.back()', () => {
    const fakeHistory = { length: 2, back: jasmine.createSpy('back') } as any;
    spyOnProperty(window, 'history', 'get').and.returnValue(fakeHistory);

    const { comp } = setupLogic();
    comp.goBack();
    expect(fakeHistory.back).toHaveBeenCalled();
  });

  it('goBack avec history.length<=1 navigue vers /', () => {
    const fakeHistory = { length: 1, back: jasmine.createSpy('back') } as any;
    spyOnProperty(window, 'history', 'get').and.returnValue(fakeHistory);

    const { comp, router } = setupLogic();
    comp.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
    expect(fakeHistory.back).not.toHaveBeenCalled();
  });

  // --------- submitComment early-returns ----------
  it('addComment: refuse si non loggé (markAllAsTouched)', () => {
    const { comp, postSvc } = setupLogic();
    comp.isLogged = false;
    comp.post = { ...basePost };
    comp.commentForm.setValue({ content: 'yo' });
    comp.addComment();
    expect(postSvc.addComment).not.toHaveBeenCalled();
    expect(comp.commentForm.touched).toBeTrue();
  });

  it('addComment: refuse si formulaire invalide (vide)', () => {
    const { comp, postSvc } = setupLogic();
    comp.isLogged = true;
    comp.post = { ...basePost };
    comp.commentForm.setValue({ content: '' }); // invalide
    comp.addComment();
    expect(postSvc.addComment).not.toHaveBeenCalled();
    expect(comp.commentForm.touched).toBeTrue();
  });

  it('addComment: refuse si post absent', () => {
    const { comp, postSvc } = setupLogic();
    comp.isLogged = true;
    comp.post = undefined; // pas de post
    comp.commentForm.setValue({ content: 'ok' });
    comp.addComment();
    expect(postSvc.addComment).not.toHaveBeenCalled();
    expect(comp.commentForm.touched).toBeTrue();
  });

  it('addComment: refuse si déjà envoi (sending=true)', () => {
    const { comp, postSvc } = setupLogic();
    comp.isLogged = true;
    comp.post = { ...basePost };
    comp.commentForm.setValue({ content: 'ok' });
    (comp as any).sending = true;
    comp.addComment();
    expect(postSvc.addComment).not.toHaveBeenCalled();
    expect(comp.commentForm.touched).toBeTrue();
  });

  // --------- submitComment success/error ----------
  it('addComment: succès -> append, reset, sending=false', () => {
    const { comp, postSvc } = setupLogic({ addCommentMode: 'ok' });
    comp.isLogged = true;
    comp.post = { ...basePost, comments: [] };
    comp.commentForm.setValue({ content: 'yo' });

    comp.addComment();

    expect(postSvc.addComment).toHaveBeenCalledWith(7, { content: 'yo' });
    expect(comp.post?.comments.length).toBe(1);
    expect((comp as any).sending).toBeFalse();
  });

  it('addComment: erreur -> sending=false', () => {
    const { comp } = setupLogic({ addCommentMode: 'error' });
    comp.isLogged = true;
    comp.post = { ...basePost, comments: [] };
    comp.commentForm.setValue({ content: 'yo' });

    comp.addComment();

    expect((comp as any).sending).toBeFalse();
  });

});
