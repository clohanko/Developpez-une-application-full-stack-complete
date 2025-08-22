import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { HomeComponent } from './home.component';
import { AuthService } from 'src/app/services/auth.service';
import { PostService } from 'src/app/services/post.service';

describe('HomeComponent (branches)', () => {
  function setup(opts?: { logged?: boolean; feed?: 'success'|'error' }) {
    const logged = opts?.logged ?? true;
    const feed = opts?.feed ?? 'success';

    const postSvc = {
      getFeed: jasmine.createSpy('getFeed').and.returnValue(
        feed === 'success'
          ? of({ items: [{ id: 1 }], page: 2, size: 5, total: 42 })
          : throwError(() => new Error('boom'))
      ),
    };

    const authSvc = {
      getLoginStatus: () => of(logged),
      logout: jasmine.createSpy('logout'),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HomeComponent], // standalone -> imports
      providers: [
        { provide: PostService, useValue: postSvc },
        { provide: AuthService, useValue: authSvc },
      ],
    })
    // 🔧 on stub le template pour éviter les erreurs "reading 'length'"
    .overrideComponent(HomeComponent, {
      set: { template: '<div>stubbed-home</div>' },
    })
    .compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture.detectChanges(); // ngOnInit()

    return { fixture, comp, postSvc, authSvc, router };
  }

  it('charge le feed quand logged=true', () => {
    const { comp, postSvc } = setup({ logged: true, feed: 'success' });
    expect(postSvc.getFeed).toHaveBeenCalledWith('desc', 0, 10);
    expect(comp.items.length).toBe(1);
    expect(comp.loading).toBeFalse();
    expect(comp.errorMsg).toBe('');
  });

  it('reset la vue quand logged=false', () => {
    const { comp, postSvc } = setup({ logged: false });
    expect(postSvc.getFeed).not.toHaveBeenCalled();
    expect(comp.items).toEqual([]);
    expect(comp.page).toBe(0);
    expect(comp.total).toBe(0);
  });

  it('load() en erreur renseigne errorMsg et remet loading=false', () => {
    const { comp } = setup({ logged: true, feed: 'error' });
    expect(comp.loading).toBeFalse();
    expect(comp.errorMsg).toContain('Impossible');
  });

  it('switchSort() bascule asc/desc et recharge à la page 0', () => {
    const { comp, postSvc } = setup({ logged: true, feed: 'success' });
    (postSvc.getFeed as jasmine.Spy).calls.reset();
  
    comp.sort = 'desc';
    comp.page = 3;
    // comp.size vaut déjà 5 car le premier load() (ngOnInit) a mis size=5 via la réponse du stub
  
    comp.switchSort();
  
    expect(comp.sort).toBe('asc');
    expect(postSvc.getFeed).toHaveBeenCalledWith('asc', 0, comp.size); // <= 5 ici
  });
  

  it('prev()/next() respectent les gardes hasPrev/hasNext', () => {
    const { comp, postSvc } = setup({ logged: true, feed: 'success' });

    // pas de prev sur page 0
    (postSvc.getFeed as jasmine.Spy).calls.reset();
    comp.page = 0; comp.total = 1; comp.size = 10;
    comp.prev();
    expect(postSvc.getFeed).not.toHaveBeenCalled();

    // prev quand page>0
    (postSvc.getFeed as jasmine.Spy).calls.reset();
    comp.page = 2; comp.total = 30; comp.size = 10;
    comp.prev();
    expect(postSvc.getFeed).toHaveBeenCalledWith('desc', 1, 10);

    // next quand il reste des pages
    (postSvc.getFeed as jasmine.Spy).calls.reset();
    comp.page = 1; comp.total = 25; comp.size = 10; // maxPages=3
    comp.next();
    expect(postSvc.getFeed).toHaveBeenCalledWith('desc', 2, 10);

    // pas de next sur dernière page
    (postSvc.getFeed as jasmine.Spy).calls.reset();
    comp.page = 2; comp.total = 25; comp.size = 10; // last page
    comp.next();
    expect(postSvc.getFeed).not.toHaveBeenCalled();
  });

  it('getters hasPrev/hasNext/maxPages', () => {
    const { comp } = setup({ logged: false });
    comp.size = 10;

    comp.total = 0; comp.page = 0;
    expect(comp.maxPages).toBe(1);
    expect(comp.hasPrev).toBeFalse();
    expect(comp.hasNext).toBeFalse();

    comp.total = 25; // ceil(25/10)=3
    expect(comp.maxPages).toBe(3);

    comp.page = 1;
    expect(comp.hasPrev).toBeTrue();
    expect(comp.hasNext).toBeTrue();

    comp.page = 2;
    expect(comp.hasNext).toBeFalse();
  });

  it('start() navigue vers /login', () => {
    const { comp, router } = setup({ logged: false });
    comp.start();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('menu: toggle/close', () => {
    const { comp } = setup({ logged: false });
    expect(comp.menuOpen).toBeFalse();
    comp.toggleMenu();
    expect(comp.menuOpen).toBeTrue();
    comp.closeMenu();
    expect(comp.menuOpen).toBeFalse();
  });

  it('logout() appelle auth.logout et redirige /', () => {
    const { comp, authSvc, router } = setup({ logged: true });
    (router.navigate as jasmine.Spy).calls.reset();
    comp.logout();
    expect(authSvc.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
