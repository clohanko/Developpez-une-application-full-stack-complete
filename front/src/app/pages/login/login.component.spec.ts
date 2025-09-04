import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from 'src/app/services/auth.service';

declare const expect: (actual: any) => jasmine.Matchers<any>;

describe('LoginComponent (branches)', () => {
  function setup(loginResult: 'success' | 'error' = 'success') {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'updateLoginStatus',
    ]);
    auth.login.and.returnValue(
      loginResult === 'success' ? of('OK') : throwError(() => new Error('nope'))
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, LoginComponent], // standalone -> imports
      providers: [{ provide: AuthService, useValue: auth }],
    })
      // on stub le template pour éviter des erreurs DOM (on teste la logique TS)
      .overrideComponent(LoginComponent, {
        set: { template: '<div>stubbed-login</div>' },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();

    return { fixture, comp, auth, router };
  }

  it('early return si formulaire invalide (branche invalid)', () => {
    const { comp, auth } = setup();
    // form vide -> invalide
    comp.onSubmit();
    expect(auth.login).not.toHaveBeenCalled();
    // le formulaire a été marqué touché
    expect(comp.loginForm.touched).toBeTrue();
  });

  it('early return si déjà en chargement (branche loading)', () => {
    const { comp, auth } = setup();
    comp.loginForm.setValue({ email: 'a@a.tld', password: 'x' });
    comp.loading = true; // garde anti double submit
    comp.onSubmit();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('succès: appelle auth.login, updateLoginStatus et navigate "/"', () => {
    const { comp, auth, router } = setup('success');
    comp.loginForm.setValue({ email: 'a@a.tld', password: 'x' });

    comp.onSubmit();

    expect(auth.login).toHaveBeenCalledWith({ email: 'a@a.tld', password: 'x' });
    expect(auth.updateLoginStatus).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
    expect(comp.loading).toBeFalse();
    expect(comp.error).toBeNull();
  });

  it('erreur: affiche le message et ne navigue pas', () => {
    const { comp, auth, router } = setup('error');
    comp.loginForm.setValue({ email: 'a@a.tld', password: 'x' });

    comp.onSubmit();

    expect(auth.login).toHaveBeenCalled();
    expect(comp.loading).toBeFalse();
    expect(comp.error).toBe('Identifiants invalides');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('goBack() navigue vers /', () => {
    const { comp, router } = setup();
    comp.goBack();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
