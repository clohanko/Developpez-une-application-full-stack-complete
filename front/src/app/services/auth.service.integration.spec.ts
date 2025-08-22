// src/app/services/auth.service.integration.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { take } from 'rxjs/operators';
import { AuthService } from './auth.service';

describe('AuthService (integration HttpClient)', () => {
  let svc: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    // Simule un cookie présent avant l’instanciation (influence la valeur initiale)
    document.cookie = 'jwt=abc; path=/';

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    svc  = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // nettoie les cookies éventuels posés par les tests
    document.cookie = 'jwt=; Max-Age=0; path=/';
    document.cookie = 'token=; Max-Age=0; path=/';
    http.verify();
  });

  function flushCtorCheckSessionOk() {
    const req = http.expectOne(r => r.method === 'GET' && /\/user\/me$/.test(r.url));
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ ok: true });
  }

  function flushCtorCheckSessionErr() {
    const req = http.expectOne(r => r.method === 'GET' && /\/user\/me$/.test(r.url));
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });
  }

  it('constructor: checkSession() OK -> loggedIn=true', () => {
    flushCtorCheckSessionOk();
    expect(svc.isLoggedIn()).toBeTrue();
  });

  it('constructor: checkSession() erreur -> avalée, loggedIn=false', () => {
    flushCtorCheckSessionErr();
    expect(svc.isLoggedIn()).toBeFalse();
  });

  it('login(): POST /auth/login, withCredentials=true, met loggedIn=true', () => {
    flushCtorCheckSessionOk();

    let done = false;
    svc.login({ email: 'a@a.tld', password: 'x' }).subscribe(() => (done = true));

    const req = http.expectOne(r => r.method === 'POST' && /\/auth\/login$/.test(r.url));
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.responseType).toBe('text');
    expect(req.request.body).toEqual({ email: 'a@a.tld', password: 'x' });
    req.flush('OK');

    expect(done).toBeTrue();
    expect(svc.isLoggedIn()).toBeTrue();
  });

  it('register(): POST /auth/register, withCredentials=true, met loggedIn=true', () => {
    flushCtorCheckSessionOk();

    let ok = false;
    svc.register({ email: 'b@b.tld', password: 'y', username: 'bob' }).subscribe(() => (ok = true));

    const req = http.expectOne(r => r.method === 'POST' && /\/auth\/register$/.test(r.url));
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.responseType).toBe('text');
    expect(req.request.body).toEqual({ email: 'b@b.tld', password: 'y', username: 'bob' });
    req.flush('OK');

    expect(ok).toBeTrue();
    expect(svc.isLoggedIn()).toBeTrue();
  });

  it('logout(): succès -> loggedIn=false + purge cookies', () => {
    flushCtorCheckSessionOk();

    const cookieSetter = spyOnProperty(document, 'cookie', 'set').and.callThrough();

    svc.logout();

    const req = http.expectOne(r => r.method === 'POST' && /\/auth\/logout$/.test(r.url));
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.responseType).toBe('text');
    req.flush('BYE');

    expect(svc.isLoggedIn()).toBeFalse();
    expect(cookieSetter.calls.allArgs().some(a => String(a[0]).startsWith('jwt=;'))).toBeTrue();
    expect(cookieSetter.calls.allArgs().some(a => String(a[0]).startsWith('token=;'))).toBeTrue();
  });

  it('logout(): erreur -> force loggedIn=false + purge cookies quand même', () => {
    flushCtorCheckSessionOk();

    const cookieSetter = spyOnProperty(document, 'cookie', 'set').and.callThrough();

    svc.logout();

    const req = http.expectOne(r => r.method === 'POST' && /\/auth\/logout$/.test(r.url));
    req.flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });

    expect(svc.isLoggedIn()).toBeFalse();
    expect(cookieSetter.calls.allArgs().some(a => String(a[0]).startsWith('jwt=;'))).toBeTrue();
    expect(cookieSetter.calls.allArgs().some(a => String(a[0]).startsWith('token=;'))).toBeTrue();
  });

  it('updateLoginStatus(): succès -> refait GET /user/me et met loggedIn=true', () => {
    flushCtorCheckSessionOk();

    svc.updateLoginStatus();

    const req = http.expectOne(r => r.method === 'GET' && /\/user\/me$/.test(r.url));
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ ok: true });

    expect(svc.isLoggedIn()).toBeTrue();
  });

  it('updateLoginStatus(): erreur -> loggedIn=false (erreur catchée)', () => {
    flushCtorCheckSessionOk();

    svc.updateLoginStatus();

    const req = http.expectOne(r => r.method === 'GET' && /\/user\/me$/.test(r.url));
    req.flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });

    expect(svc.isLoggedIn()).toBeFalse();
  });

  it('checkSession() direct: renvoie true et met loggedIn=true', () => {
    flushCtorCheckSessionOk();

    let value: boolean | undefined;
    svc.checkSession().subscribe(v => (value = v));

    const req = http.expectOne(r => r.method === 'GET' && /\/user\/me$/.test(r.url));
    req.flush({ ok: true });

    expect(value).toBeTrue();
    expect(svc.isLoggedIn()).toBeTrue();
  });

  it('checkSession() direct: renvoie false (401) et met loggedIn=false', () => {
    flushCtorCheckSessionOk();

    let value: boolean | undefined;
    svc.checkSession().subscribe(v => (value = v));

    const req = http.expectOne(r => r.method === 'GET' && /\/user\/me$/.test(r.url));
    req.flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });

    expect(value).toBeFalse();
    expect(svc.isLoggedIn()).toBeFalse();
  });

  it('getLoginStatus(): émet la valeur courante du BehaviorSubject', (done) => {
    // termine le GET du constructeur (met true)
    flushCtorCheckSessionOk();

    // 1) première émission
    svc.getLoginStatus().pipe(take(1)).subscribe(val => {
      expect(typeof val).toBe('boolean');

      // 2) déclenche un logout et vérifie la suivante
      svc.logout();
      const logoutReq = http.expectOne(r => r.method === 'POST' && /\/auth\/logout$/.test(r.url));
      logoutReq.flush('OK');

      svc.getLoginStatus().pipe(take(1)).subscribe(v2 => {
        expect(v2).toBeFalse();
        done();
      });
    });
  });
});
