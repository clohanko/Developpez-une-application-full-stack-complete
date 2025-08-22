import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { NavbarComponent } from './navbar.component';
import { AuthService } from 'src/app/services/auth.service';

class FakeRouter {
  navigate = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));
}

describe('NavbarComponent', () => {
  function setup(getLoginStatusObs = of(true)) {
    const auth = {
      getLoginStatus: jasmine.createSpy('getLoginStatus').and.returnValue(getLoginStatusObs),
      logout: jasmine.createSpy('logout'),
    } as unknown as AuthService;

    const router = new FakeRouter() as unknown as Router;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NavbarComponent], // standalone
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    })
      // on stub le template pour ignorer le HTML
      .overrideComponent(NavbarComponent, { set: { template: '<nav>stubbed</nav>' } })
      .compileComponents();

    const fixture = TestBed.createComponent(NavbarComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges(); // déclenche l’abonnement dans le ctor

    return { fixture, comp, auth, router };
  }

  it('should create', () => {
    const { comp } = setup();
    expect(comp).toBeTruthy();
  });

  it('isLogged = true quand getLoginStatus() émet true', () => {
    const { comp } = setup(of(true));
    expect(comp.isLogged).toBeTrue();
  });

  it('isLogged = false quand getLoginStatus() émet false', () => {
    const { comp } = setup(of(false));
    expect(comp.isLogged).toBeFalse();
  });

  it('isLogged = false quand getLoginStatus() émet une erreur (catchError)', () => {
    const { comp } = setup(throwError(() => new Error('boom')));
    expect(comp.isLogged).toBeFalse();
  });

  it('toggleMenu() bascule menuOpen', () => {
    const { comp } = setup();
    expect(comp.menuOpen).toBeFalse();

    comp.toggleMenu();
    expect(comp.menuOpen).toBeTrue();

    comp.toggleMenu();
    expect(comp.menuOpen).toBeFalse();
  });

  it('closeMenu() force menuOpen = false', () => {
    const { comp } = setup();
    comp.toggleMenu(); // passe à true
    expect(comp.menuOpen).toBeTrue();

    comp.closeMenu();
    expect(comp.menuOpen).toBeFalse();
  });

  it('logout() appelle auth.logout, ferme le menu et navigue /', () => {
    const { comp, auth, router } = setup();
    comp.menuOpen = true;

    comp.logout();

    expect(auth.logout).toHaveBeenCalled();
    expect(comp.menuOpen).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
