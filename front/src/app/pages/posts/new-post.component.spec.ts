import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { NewPostComponent } from './new-post.component';
import { TopicService, Topic } from 'src/app/services/topic.service';
import { PostService } from 'src/app/services/post.service';

declare const expect: (actual: any) => jasmine.Matchers<any>;

describe('NewPostComponent (branches)', () => {
  function setup(opts?: {
    topicsMode?: 'success' | 'error';
    createMode?: 'success' | 'error';
  }) {
    const topicsMode = opts?.topicsMode ?? 'success';
    const createMode = opts?.createMode ?? 'success';

    const topicSvc = {
      list: jasmine.createSpy('list').and.returnValue(
        topicsMode === 'success'
          ? of<Topic[]>([{ id: 1, name: 'Angular', description: '' } as Topic])
          : throwError(() => new Error('boom'))
      ),
      mySubscriptions: jasmine.createSpy('mySubscriptions'),
      unsubscribe: jasmine.createSpy('unsubscribe'),
    };

    const postSvc = {
      create: jasmine.createSpy('create').and.returnValue(
        createMode === 'success'
          ? of({ id: 123 })
          : throwError(() => new Error('nope'))
      ),
      getFeed: jasmine.createSpy('getFeed'),
      getOne: jasmine.createSpy('getOne'),
      addComment: jasmine.createSpy('addComment'),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, NewPostComponent],
      providers: [
        { provide: TopicService, useValue: topicSvc },
        { provide: PostService, useValue: postSvc },
      ],
    })
      .overrideComponent(NewPostComponent, { set: { template: '<div>stubbed-new-post</div>' } })
      .compileComponents();

    const fixture = TestBed.createComponent(NewPostComponent);
    const comp = fixture.componentInstance;

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture.detectChanges(); // ngOnInit()

    return { fixture, comp, topicSvc, postSvc, router };
  }

  // -------- ngOnInit --------
  it('ngOnInit: charge les topics (succès)', () => {
    const { comp, topicSvc } = setup({ topicsMode: 'success' });
    expect(topicSvc.list).toHaveBeenCalled();
    expect(comp.topics.length).toBe(1);
    expect(comp.errorMsg).toBe('');
  });

  it('ngOnInit: en erreur, place un message', () => {
    const { comp } = setup({ topicsMode: 'error' });
    expect(comp.errorMsg).toContain('Impossible de charger les thèmes');
  });

  // -------- submit() branches --------
  it('early return si form invalide (markAllAsTouched, pas de create)', () => {
    const { comp, postSvc } = setup();
    comp.form.reset(); // vide => invalide
    comp.submit();
    expect(postSvc.create).not.toHaveBeenCalled();
    expect(comp.form.touched).toBeTrue();
  });

  it('early return si loading=true (garde anti double-submit)', () => {
    const { comp, postSvc } = setup();
    comp.form.setValue({ topicId: 1, title: 'abc', content: 'x' });
    (comp as any).loading = true;
    comp.submit();
    expect(postSvc.create).not.toHaveBeenCalled();
  });

  it('topicId null -> message et loading remis à false (en retirant le validator pour couvrir la branche)', () => {
    const { comp, postSvc } = setup();
    const ctrl = comp.form.controls.topicId;
    ctrl.clearValidators();
    ctrl.updateValueAndValidity();

    comp.form.setValue({ topicId: null, title: 'abc', content: 'x' });
    expect(comp.form.valid).toBeTrue(); // on s’assure que c’est bien la branche topicId==null qui décide

    comp.submit();

    expect(postSvc.create).not.toHaveBeenCalled();
    expect(comp.errorMsg).toBe('Choisis un thème.');
    expect(comp.loading).toBeFalse();
  });

  it('succès: envoie le payload typé et navigue vers /posts/:id', () => {
    const { comp, postSvc, router } = setup({ createMode: 'success' });
    comp.form.setValue({ topicId: 1, title: 'Hello', content: 'World' });

    comp.submit();

    expect(postSvc.create).toHaveBeenCalledWith({ topicId: 1, title: 'Hello', content: 'World' });
    expect(router.navigate).toHaveBeenCalledWith(['/posts', 123]);

    expect(comp['loading']).toBeTrue();
    expect(comp.errorMsg).toBe('');
  });

  it('erreur: affiche "Échec de création." et remet loading=false', () => {
    const { comp, postSvc } = setup({ createMode: 'error' });
    comp.form.setValue({ topicId: 1, title: 'Hello', content: 'World' });

    comp.submit();

    expect(postSvc.create).toHaveBeenCalled();
    expect(comp.loading).toBeFalse();
    expect(comp.errorMsg).toBe('Échec de création.');
  });

  // -------- goBack() --------
  it('goBack() appelle history.back() ou navigate("/")', () => {
    const { comp, router } = setup();
    const backSpy = spyOn(history, 'back');
    comp.goBack();
    expect(backSpy.calls.count() + (router.navigate as jasmine.Spy).calls.count()).toBeGreaterThan(0);
  });
});
