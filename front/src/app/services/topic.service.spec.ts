// src/app/services/topic.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TopicService, Topic } from './topic.service';
import { environment } from 'src/environments/environment';

describe('TopicService', () => {
  let svc: TopicService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    svc = TestBed.inject(TopicService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() should GET topics', () => {
    const mock: Topic[] = [{ id: 1, name: 'Angular', description: '' } as Topic];
    svc.list().subscribe(t => expect(t.length).toBe(1));

    const req = http.expectOne(r => r.url.includes(environment.apiUrl) && r.url.includes('topic'));
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('mySubscriptions() should GET ids[]', () => {
    svc.mySubscriptions().subscribe(ids => expect(ids).toEqual([1,2]));

    const req = http.expectOne(r => r.url.includes('subscription'));
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue?.(); // si tu l’utilises
    req.flush([1,2]);
  });

  it('unsubscribe() should DELETE by id', () => {
    svc.unsubscribe(42).subscribe(ok => expect(ok).toBeTruthy());

    const req = http.expectOne(r => r.url.includes('subscription') && r.url.includes('42'));
    expect(req.request.method).toBe('DELETE');
    expect(req.request.withCredentials).toBeTrue?.();
    req.flush({ ok: true });
  });
});
