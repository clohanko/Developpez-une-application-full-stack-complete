// src/app/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, LoginCredentials, RegisterPayload } from './auth.service';
import { environment } from 'src/environments/environment';
import { firstValueFrom } from 'rxjs';

describe('AuthService', () => {
  let svc: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    http = TestBed.inject(HttpTestingController);

    // ⚠️ Le constructeur d’AuthService déclenche checkSession() -> 1 GET /user/me
    // On instancie le service, puis on "flush" immédiatement cette requête initiale.
    svc = TestBed.inject(AuthService);
    const init = http.expectOne(`${environment.apiUrl}/user/me`);
    init.flush('NO', { status: 401, statusText: 'Unauthorized' }); // baseline: loggedIn=false
  });

  afterEach(() => http.verify());

  it('login() should POST and set loggedIn=true', async () => {
    const creds: LoginCredentials = { email: 'a@a.tld', password: 'x' };

    const p = firstValueFrom(svc.login(creds));

    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.responseType).toBe('text');
    req.flush('OK');
    await p;

    expect(svc.isLoggedIn()).toBeTrue();
  });

  it('register() should POST and set loggedIn=true', async () => {
    const payload: RegisterPayload = { email: 'a@a.tld', password: 'x', username: 'alice' };

    const p = firstValueFrom(svc.register(payload));

    const req = http.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.responseType).toBe('text');
    req.flush('OK');
    await p;

    expect(svc.isLoggedIn()).toBeTrue();
  });

  it('checkSession() ok should set loggedIn=true', async () => {
    const p = firstValueFrom(svc.checkSession());

    const req = http.expectOne(`${environment.apiUrl}/user/me`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ username: 'u', email: 'e' });

    const ok = await p;
    expect(ok).toBeTrue();
    expect(svc.isLoggedIn()).toBeTrue();
  });

  it('checkSession() error should set loggedIn=false', async () => {
    const p = firstValueFrom(svc.checkSession());

    const req = http.expectOne(`${environment.apiUrl}/user/me`);
    req.flush('NO', { status: 401, statusText: 'Unauthorized' });

    const ok = await p;
    expect(ok).toBeFalse();
    expect(svc.isLoggedIn()).toBeFalse();
  });

  it('logout() error path should still force loggedIn=false and clear cookies', () => {
    const setCookieSpy = spyOnProperty(document, 'cookie', 'set');
  
    svc.logout();
  
    const req = http.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush('KO', { status: 500, statusText: 'Server Error' }); // ⬅️ force la branche error
  
    expect(svc.isLoggedIn()).toBeFalse();
    expect(setCookieSpy).toHaveBeenCalledTimes(2);
  });
  
  it('updateLoginStatus() should swallow errors (branch via catchError)', () => {
    // Appel interne à checkSession()
    svc.updateLoginStatus();
  
    const req = http.expectOne(`${environment.apiUrl}/user/me`);
    expect(req.request.method).toBe('GET');
    req.flush('NO', { status: 401, statusText: 'Unauthorized' }); // ⬅️ branche erreur de catchError dans updateLoginStatus()
  
    // Pas d’exception propagée, état posé à false par tap()
    expect(svc.isLoggedIn()).toBeFalse();
  });
  
});
