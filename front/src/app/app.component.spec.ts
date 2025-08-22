import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';

class FakeRouter {
  url = '/';
  events = new Subject<any>();
  navigate = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));
  navigateByUrl = jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true));
}

describe('AppComponent (branches)', () => {
  function setup(
    opts: {
      loginStatus?: 'ok-true' | 'ok-false' | 'error';
      checkSession?: 'ok' | 'error';
      initialUrl?: string;
    } = {}
  ) {
    const { initialUrl = '/', loginStatus = 'ok-true', checkSession = 'ok' } = opts;

    const router = new FakeRouter();
    router.url = initialUrl;

    const auth = {
      checkSession: jasmine.createSpy('checkSession').and.returnValue(
        checkSession === 'ok' ? of(true) : throwError(() => new Error('neterr'))
      ),
      getLoginStatus: jasmine.createSpy('getLoginStatus').and.returnValue(
        loginStatus === 'ok-true'
          ? of(true)
          : loginStatus === 'ok-false'
          ? of(false)
          : throwError(() => new Error('boom'))
      ),
    } as unknown as AuthService;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AppComponent], // standalone
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
      ],
    })
      .overrideComponent(AppComponent, { set: { template: '<div>stubbed-app</div>' } })
      .compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit

    return { fixture, comp, router, auth };
  }

  it('should create the app', () => {
    const { comp } = setup();
    expect(comp).toBeTruthy();
  });

  it('initial flags from current URL + updates on navigation', () => {
    const { comp, router } = setup({ initialUrl: '/' });

    // initial '/'
    expect(comp.isHomePage).toBeTrue();
    expect(comp.isAuthPage).toBeFalse();

    // -> /login
    router.events.next(new NavigationEnd(1, '/login', '/login'));
    expect(comp.isAuthPage).toBeTrue();
    expect(comp.isHomePage).toBeFalse();

    // -> /register
    router.events.next(new NavigationEnd(2, '/register', '/register'));
    expect(comp.isAuthPage).toBeTrue();
    expect(comp.isHomePage).toBeFalse();

    // -> /posts/42
    router.events.next(new NavigationEnd(3, '/posts/42', '/posts/42'));
    expect(comp.isAuthPage).toBeFalse();
    expect(comp.isHomePage).toBeFalse();
  });

  // Bonus: URL initiale vide => home
  it('empty initial URL is treated as home', () => {
    const { comp } = setup({ initialUrl: '' });
    expect(comp.isHomePage).toBeTrue();
    expect(comp.isAuthPage).toBeFalse();
  });

  // ✅ Branche d’erreur de getLoginStatus() (catchError -> false)
  it('fallback à isLogged=false quand getLoginStatus() émet une erreur', () => {
    const { comp } = setup({ loginStatus: 'error' });
    expect(comp.isLogged).toBeFalse();
  });

  // (bonus) branche "ok-false" de getLoginStatus()
  it('isLogged suit la valeur de getLoginStatus() (false)', () => {
    const { comp } = setup({ loginStatus: 'ok-false' });
    expect(comp.isLogged).toBeFalse();
  });

  // (bonus) checkSession en erreur est bien “avalé” (pas de crash)
  it('checkSession en erreur est catché (composant reste vivant)', () => {
    const { comp } = setup({ checkSession: 'error' });
    expect(comp).toBeTruthy();
  });
});
