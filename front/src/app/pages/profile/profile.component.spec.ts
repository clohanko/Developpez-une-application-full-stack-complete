import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MeDto } from 'src/app/services/user.service';

import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { TopicService } from 'src/app/services/topic.service';

describe('ProfileComponent (full coverage)', () => {
  function setup(opts?: {
    sessionOk?: boolean;
    meMode?: 'ok' | 'err';
    topicsMode?: 'ok' | 'err';
    subsMode?: 'ok' | 'err';
    unsubMode?: 'ok' | 'err';
  }) {
    const sessionOk = opts?.sessionOk ?? true;
    const meMode    = opts?.meMode    ?? 'ok';
    const topicsMode= opts?.topicsMode?? 'ok';
    const subsMode  = opts?.subsMode  ?? 'ok';
    const unsubMode = opts?.unsubMode ?? 'ok';

    const authSvc = {
      checkSession: () => of(sessionOk),
      getLoginStatus: () => of(true),
    };

    const userSvc = {
      getCurrentUser: () =>
        meMode === 'ok' ? of({ username: 'alice', email: 'a@a.tld' }) : throwError(() => new Error('nope')),
      updateMe: jasmine.createSpy('updateMe').and.returnValue(of('OK')),
      updatePassword: jasmine.createSpy('updatePassword').and.returnValue(of('OK')),
    };

    const allTopics = [
      { id: 1, name: 'Angular', description: '' },
      { id: 2, name: 'Nest', description: '' },
    ];
    const topicSvc = {
      list:        () => (topicsMode === 'ok' ? of(allTopics as any) : throwError(() => new Error('boom'))),
      mySubscriptions: () => (subsMode === 'ok' ? of([1, 2]) : throwError(() => new Error('x'))),
      unsubscribe: jasmine.createSpy('unsubscribe').and.returnValue(
        unsubMode === 'ok' ? of('OK') : throwError(() => new Error('x'))
      ),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, ProfileComponent],
      providers: [
        { provide: AuthService,  useValue: authSvc },
        { provide: UserService,  useValue: userSvc },
        { provide: TopicService, useValue: topicSvc },
      ],
    })
    // On stub le template: on cible la logique TS
    .overrideComponent(ProfileComponent, { set: { template: '<div>stubbed-profile</div>' } })
    .compileComponents();

    const fixture = TestBed.createComponent(ProfileComponent);
    const comp = fixture.componentInstance;

    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    fixture.detectChanges(); // ngOnInit()

    return { fixture, comp, router, userSvc, topicSvc, authSvc };
  }

  // --- Validateur ---
  it('matchPasswords: mismatch -> error, puis ok', () => {
    const { comp } = setup();
    comp.passwordForm.setValue({ oldPassword:'xxxxx', newPassword:'abc', confirmNewPassword:'def' });
    expect(comp.passwordForm.hasError('passwordMismatch')).toBeTrue();

    comp.passwordForm.setValue({ oldPassword:'xxxxx', newPassword:'abc', confirmNewPassword:'abc' });
    expect(comp.passwordForm.hasError('passwordMismatch')).toBeFalse();
  });

  // --- submitProfile ---
  it('submitProfile: early return si form invalide', () => {
    const { comp, userSvc } = setup();
    comp.profileForm.setValue({ username:'', email:'bad' });
    comp.submitProfile();
    expect(userSvc.updateMe).not.toHaveBeenCalled();
  });

  it('submitProfile: success (user existant)', () => {
    const { comp, userSvc } = setup();
    comp.profileForm.setValue({ username:'bob', email:'b@b.tld' });
    comp.submitProfile();
    expect(userSvc.updateMe).toHaveBeenCalled();
    expect(comp.msgProfile?.type).toBe('success');
    expect(comp.loadingProfile).toBeFalse();
    expect(comp.user?.username).toBe('bob');
  });

  it('submitProfile: success (user null → branche else)', () => {
    const { comp, userSvc } = setup();
    comp.user = null;
    comp.profileForm.setValue({ username:'bob', email:'b@b.tld' });
    comp.submitProfile();
    expect(userSvc.updateMe).toHaveBeenCalled();
    expect(comp.user).toEqual(
      jasmine.objectContaining({ username: 'bob', email: 'b@b.tld' })
    );
        });

  it('submitProfile: error', () => {
    const { comp, userSvc } = setup();
    (userSvc.updateMe as jasmine.Spy).and.returnValue(throwError(() => new Error('boom')));
    comp.profileForm.setValue({ username:'bob', email:'b@b.tld' });
    comp.submitProfile();
    expect(comp.msgProfile?.type).toBe('error');
    expect(comp.loadingProfile).toBeFalse();
  });

  // --- submitPassword ---
  it('submitPassword: early return si form invalide', () => {
    const { comp, userSvc } = setup();
    comp.passwordForm.setValue({ oldPassword:'', newPassword:'', confirmNewPassword:'' });
    comp.submitPassword();
    expect(userSvc.updatePassword).not.toHaveBeenCalled();
  });

  it('submitPassword: success -> reset du form', () => {
    const { comp, userSvc } = setup();
    comp.passwordForm.setValue({ oldPassword:'oldold', newPassword:'newnew', confirmNewPassword:'newnew' });
    comp.submitPassword();
    expect(userSvc.updatePassword).toHaveBeenCalled();
    expect(comp.msgPassword?.type).toBe('success');
    expect(comp.loadingPassword).toBeFalse();
  });

  it('submitPassword: error', () => {
    const { comp, userSvc } = setup();
    (userSvc.updatePassword as jasmine.Spy).and.returnValue(throwError(() => new Error('nope')));
    comp.passwordForm.setValue({ oldPassword:'oldold', newPassword:'newnew', confirmNewPassword:'newnew' });
    comp.submitPassword();
    expect(comp.msgPassword?.type).toBe('error');
    expect(comp.loadingPassword).toBeFalse();
  });

  // --- ngOnInit branches ---
  it('redirige /login si session invalide', () => {
    const { router } = setup({ sessionOk: false });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('redirige /login si getCurrentUser() échoue', () => {
    const { router } = setup({ meMode: 'err' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('topics.list() erreur -> subscriptions = []', () => {
    const { comp } = setup({ topicsMode: 'err' });
    expect(comp.subscriptions).toEqual([]);
  });

  it('mySubscriptions() erreur -> subscriptions = []', () => {
    const { comp } = setup({ subsMode: 'err' });
    expect(comp.subscriptions).toEqual([]);
  });

  // --- onUnsubscribe branches ---
  it('onUnsubscribe: early return si déjà en cours', () => {
    const { comp, topicSvc } = setup();
    comp.loadingIds.add(1);
    comp.onUnsubscribe(1);
    expect(topicSvc.unsubscribe).not.toHaveBeenCalled();
  });

  it('onUnsubscribe: success retire le topic + nettoie loadingIds', () => {
    const { comp, topicSvc } = setup({ unsubMode: 'ok' });
    comp.subscriptions = [
      { id: 1, name: 'A', description: '' } as any,
      { id: 2, name: 'B', description: '' } as any,
    ];
    comp.onUnsubscribe(1);
    expect(topicSvc.unsubscribe).toHaveBeenCalledWith(1);
    expect(comp.subscriptions.map(t => Number(t.id))).toEqual([2]);
    expect(comp.loadingIds.has(1)).toBeFalse();
  });

  it('onUnsubscribe: erreur ne retire pas et nettoie loadingIds', () => {
    const { comp, topicSvc } = setup({ unsubMode: 'err' });
    comp.subscriptions = [
      { id: 1, name: 'A', description: '' } as any,
      { id: 2, name: 'B', description: '' } as any,
    ];
    comp.onUnsubscribe(1);
    expect(topicSvc.unsubscribe).toHaveBeenCalledWith(1);
    expect(comp.subscriptions.map(t => Number(t.id))).toEqual([1, 2]);
    expect(comp.loadingIds.has(1)).toBeFalse();
  });

  // --- getters (comptent comme fonctions) ---
  it('expose les getters f et p', () => {
    const { comp } = setup();
    expect(comp.f.email).toBeDefined();
    expect(comp.p.newPassword).toBeDefined();
  });
});
