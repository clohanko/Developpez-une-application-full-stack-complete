import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from 'src/app/services/auth.service';

describe('RegisterComponent (branches)', () => {
  const STRONG_PWD = 'Abcd1234!';

  function setup(mode: 'success' | 'error-msg' | 'error-fallback' = 'success') {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['register']);
    if (mode === 'success') {
      auth.register.and.returnValue(of('OK'));
    } else if (mode === 'error-msg') {
      auth.register.and.returnValue(
        throwError(() => ({ error: { message: 'Oups' } }))
      );
    } else {
      auth.register.and.returnValue(
        throwError(() => ({})) // pas de error.message -> fallback
      );
    }

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, RegisterComponent], // standalone -> imports
      providers: [{ provide: AuthService, useValue: auth }],
    })
      // on stub le template: on teste la logique TS, pas le DOM
      .overrideComponent(RegisterComponent, {
        set: { template: '<div>stubbed-register</div>' },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(RegisterComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    fixture.detectChanges(); // ngOnInit -> crée le form

    return { fixture, comp, auth, router };
  }

  it('early return si formulaire invalide (pas d’appel register)', () => {
    const { comp, auth } = setup();
    // form vide -> invalide
    comp.onSubmit();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('succès: appelle register et redirige vers /login', () => {
    const { comp, auth, router } = setup('success');

    comp.registerForm.setValue({
      username: 'bob',
      email: 'b@b.tld',
      password: STRONG_PWD,
      passwordConfirm: STRONG_PWD, // 👈 obligatoire
    });

    comp.onSubmit();

    expect(auth.register).toHaveBeenCalledWith({
      username: 'bob',
      email: 'b@b.tld',         // sera normalisé en .ts mais la valeur envoyée correspond
      password: STRONG_PWD,
    });
    expect(comp.loading).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(comp.errorMessage).toBe('');
  });

  it('erreur avec message: affiche le message backend et stoppe le loading', () => {
    const { comp, router } = setup('error-msg');

    comp.registerForm.setValue({
      username: 'bob',
      email: 'b@b.tld',
      password: STRONG_PWD,
      passwordConfirm: STRONG_PWD,
    });

    comp.onSubmit();

    expect(comp.loading).toBeFalse();
    expect(comp.errorMessage).toBe('Oups');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('erreur sans message: utilise le fallback', () => {
    const { comp } = setup('error-fallback');

    comp.registerForm.setValue({
      username: 'bob',
      email: 'b@b.tld',
      password: STRONG_PWD,
      passwordConfirm: STRONG_PWD,
    });

    comp.onSubmit();

    expect(comp.loading).toBeFalse();
    expect(comp.errorMessage).toBe('Erreur lors de l’inscription');
  });

  it('goBack() navigue vers /', () => {
    const { comp, router } = setup();
    comp.goBack();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
