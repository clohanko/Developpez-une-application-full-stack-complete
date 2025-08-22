/* eslint-disable @typescript-eslint/no-namespace */
export {}; // force module

// ================= UI commands =================
Cypress.Commands.add('loginViaUI', (email: string, password: string) => {
  if (!email || !password) throw new Error('Définis E2E_EMAIL / E2E_PASSWORD');

  // Intercept AVANT la visite pour capter la requête
  cy.intercept('POST', '**/api/auth/login').as('login');

  return cy
    .visit('/login', { failOnStatusCode: false })
    .get('input[formControlName="email"]').clear().type(email)
    .get('input[formControlName="password"]').clear().type(password)
    .get('button[type="submit"]').click()
    .then(() => undefined); // neutralise le subject si tu chaines derrière
});

Cypress.Commands.add('registerViaUI', (email: string, password: string, username: string) => {
  cy.intercept('POST', '**/api/auth/register').as('register');

  return cy
    .visit('/register', { failOnStatusCode: false })
    .get('input[formControlName="username"]').clear().type(username)
    .get('input[formControlName="email"]').clear().type(email)
    .get('input[formControlName="password"]').clear().type(password)
    .get('button[type="submit"]').click()
    .then(() =>
      cy.wait('@register').then((i) => {
        expect([200, 201, 204]).to.include(i.response?.statusCode!);
      })
    )
    .then(() =>
      cy.location('pathname', { timeout: 10_000 }).should((p) => {
        expect(p).to.match(/^(\/login|\/)$/);
      })
    )
    .then(() => undefined);
});

// ================= API helpers =================
const API = 'http://localhost:8080/api';

Cypress.Commands.add('ensureUserViaAPI', (email: string, password: string, username: string) => {
  return cy
    .request({
      method: 'POST',
      url: `${API}/auth/register`,
      body: { email, password, username },
      failOnStatusCode: false,
    })
    .then((res) => {
      // "déjà existant" accepté
      expect([200, 201, 204, 400, 409]).to.include(res.status);
    })
    .then(() => undefined);
});

Cypress.Commands.add('loginProgrammatically', (email: string, password: string) => {
  const attempts = [
    { email, password },
    { emailOrUsername: email, password },
    { username: email, password },
    { login: email, password },
  ] as Array<Record<string, unknown>>;

  const tryLogin = (idx = 0): Cypress.Chainable<Cypress.Response<any>> => {
    if (idx >= attempts.length) {
      throw new Error('Login API a échoué avec toutes les variantes de payload.');
    }
    return cy
      .request({
        method: 'POST',
        url: `${API}/auth/login`,
        body: attempts[idx],
        failOnStatusCode: false,
      })
      .then((res) => {
        if ([200, 201, 204].includes(res.status)) return cy.wrap(res);

        // Dernière chance : XSRF (rare mais on couvre)
        if (idx === attempts.length - 1) {
          return cy
            .request({ method: 'GET', url: `${API}/user/me`, failOnStatusCode: false })
            .then(() => cy.getCookie('XSRF-TOKEN')) // pas de domain -> plus souple
            .then((cookie) => {
              const headers = cookie?.value ? { 'X-XSRF-TOKEN': cookie.value } : {};
              return cy.request({
                method: 'POST',
                url: `${API}/auth/login`,
                body: attempts[idx],
                headers,
                failOnStatusCode: false,
              });
            })
            .then((res2) => {
              if ([200, 201, 204].includes(res2.status)) return cy.wrap(res2);
              throw new Error(
                `Login API 401/403. Dernière réponse: ${res2.status} ${
                  res2.body ? JSON.stringify(res2.body) : '(body vide)'
                }`
              );
            });
        }

        // Essaie la forme suivante
        return tryLogin(idx + 1);
      });
  };

  return tryLogin()
    .then((res) => {
      // Si le back renvoie un token, on le place aussi dans localStorage
      const body = res.body;
      const token =
        (body && (body.token || body.accessToken || body.jwt)) ||
        (typeof body === 'string' ? body : '');
      if (token) {
        cy.window({ log: false }).then((win) => {
          ['token', 'jwt', 'accessToken', 'authToken'].forEach((k) => {
            try { win.localStorage.setItem(k, token); } catch {}
          });
        });
      }
    })
    // Vérifie la session côté API
    .then(() =>
      cy.request({ url: `${API}/user/me`, method: 'GET', failOnStatusCode: false })
    )
    .its('status')
    .should('eq', 200)
    .then(() => undefined);
});
