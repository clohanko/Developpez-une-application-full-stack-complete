import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { AuthService } from 'src/app/services/auth.service';
import { PostDto } from 'src/app/services/post.service';

describe('HomeComponent (integration HttpClient)', () => {
  const sample = (n: number): PostDto[] =>
    Array.from({ length: n }).map((_, i) => ({
      id: i + 1,
      topicId: 1,
      topicName: 'Angular',
      title: `Post ${i + 1}`,
      content: 'C',
      authorId: 1,
      authorUsername: 'u',
      createdAt: '2025-01-01',
      comments: [],
    }));

    function expectFeed(
        http: HttpTestingController,
        { sort, page, size }: { sort: 'asc' | 'desc'; page: number; size: number }
      ) {
        return http.expectOne(req => {
          const url = req.urlWithParams || req.url; // robuste selon l'env
          const hitsFeed = /\/feed(?:\?|$)/.test(url); // match /feed avec ou sans host/query
          return (
            req.method === 'GET' &&
            hitsFeed &&
            url.includes(`sort=${sort}`) &&
            url.includes(`page=${page}`) &&
            url.includes(`size=${size}`)
          );
        });
      }
      

  function setup(getLoginStatus$ = of(true)) {
    const authStub = { getLoginStatus: () => getLoginStatus$ } as Partial<AuthService>;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, HomeComponent], // standalone + vrai template
      providers: [{ provide: AuthService, useValue: authStub }],
    }).compileComponents();

    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(HomeComponent);
    const comp = fixture.componentInstance;

    fixture.detectChanges(); // ngOnInit() -> peut déclencher un GET selon getLoginStatus
    return { fixture, comp, http };
  }

  afterEach(() => {
    const http = TestBed.inject(HttpTestingController);
    http.verify();
  });

  it('ngOnInit (logged=true) charge le feed, puis switchSort couvre desc→asc→desc', () => {
    const { fixture, comp, http } = setup(of(true));

    // 1) appel initial sort=desc&page=0&size=10
    expectFeed(http, { sort: 'desc', page: 0, size: 10 }).flush({
      items: sample(3), page: 0, size: 10, total: 3
    });
    fixture.detectChanges();

    expect(comp.items.length).toBe(3);
    expect(comp.loading).toBeFalse();
    expect(comp.sort).toBe('desc');

    // 2) switchSort() -> asc (et charge page 0)
    comp.switchSort();
    fixture.detectChanges();

    expectFeed(http, { sort: 'asc', page: 0, size: 10 }).flush({
      items: sample(2), page: 0, size: 10, total: 2
    });
    fixture.detectChanges();
    expect(comp.sort).toBe('asc');
    expect(comp.items.length).toBe(2);

    // 3) re-switchSort() -> desc (autre bras de la branche)
    comp.switchSort();
    fixture.detectChanges();

    expectFeed(http, { sort: 'desc', page: 0, size: 10 }).flush({
      items: sample(1), page: 0, size: 10, total: 1
    });
    fixture.detectChanges();
    expect(comp.sort).toBe('desc');
    expect(comp.items.length).toBe(1);
  });

  it('prev()/next(): ne déclenche que si hasPrev/hasNext', () => {
    const { fixture, comp, http } = setup(of(true));

    // initial
    expectFeed(http, { sort: 'desc', page: 0, size: 10 }).flush({
      items: sample(10), page: 0, size: 10, total: 25
    });
    fixture.detectChanges();

    // prev() à page 0 => rien
    comp.prev();
    http.expectNone(() => true);

    // next() -> page 1
    comp.next();
    expectFeed(http, { sort: 'desc', page: 1, size: 10 }).flush({
      items: sample(10), page: 1, size: 10, total: 25
    });
    fixture.detectChanges();
    expect(comp.page).toBe(1);

    // aller à la dernière page (page 2)
    comp.next();
    expectFeed(http, { sort: 'desc', page: 2, size: 10 }).flush({
      items: sample(5), page: 2, size: 10, total: 25
    });
    fixture.detectChanges();
    expect(comp.page).toBe(2);
    expect(comp.hasNext).toBeFalse();

    // next() en butée => rien
    comp.next();
    http.expectNone(() => true);
  });

  it('ngOnInit (logged=false) appelle reset() et ne fait AUCUNE requête', () => {
    const { comp, http } = setup(of(false));
    expect(comp.isLogged).toBeFalse();
    expect(comp.items.length).toBe(0);
    expect(comp.page).toBe(0);
    expect(comp.total).toBe(0);
    expect(comp.errorMsg).toBe('');
    http.expectNone(() => true); // aucune requête HTTP
  });

  it('load() erreur -> message et loading=false', () => {
    const { comp, http } = setup(of(true));

    const req = expectFeed(http, { sort: 'desc', page: 0, size: 10 });
    req.flush({ message: 'KO' }, { status: 500, statusText: 'Server Error' });

    expect(comp.loading).toBeFalse();
    expect(comp.errorMsg).toBe('Impossible de charger le fil.');
  });
});
