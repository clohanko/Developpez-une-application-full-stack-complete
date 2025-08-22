// src/app/services/user.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService, MeDto, UpdateUserPayload, UpdatePasswordPayload } from './user.service';
import { environment } from 'src/environments/environment';

describe('UserService', () => {
  let svc: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    svc = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getCurrentUser() should return MeDto', () => {
    const mock: MeDto = { username: 'alice', email: 'a@a.tld' };

    svc.getCurrentUser().subscribe(u => {
      expect(u).toEqual(mock);
    });

    const req = http.expectOne(`${environment.apiUrl}/user/me`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(mock);
  });

  it('updateMe() should PUT payload (text response)', () => {
    const payload: UpdateUserPayload = { username: 'bob', email: 'b@b.tld' };

    svc.updateMe(payload).subscribe(txt => expect(txt).toBe('OK'));

    const req = http.expectOne(`${environment.apiUrl}/user/me`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.responseType).toBe('text');
    expect(req.request.body).toEqual(payload);
    req.flush('OK');
  });

  it('updatePassword() should PUT payload (text response)', () => {
    const payload: UpdatePasswordPayload = { oldPassword: 'old', newPassword: 'new' };

    svc.updatePassword(payload).subscribe(txt => expect(txt).toBe('OK'));

    const req = http.expectOne(`${environment.apiUrl}/user/me/password`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.responseType).toBe('text');
    expect(req.request.body).toEqual(payload);
    req.flush('OK');
  });
});
