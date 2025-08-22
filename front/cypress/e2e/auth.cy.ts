/// <reference types="cypress" />

describe('Authentification (UI only, stubbed)', () => {
  beforeEach(() => {
    // Invité par défaut, utile quand on ne stubbe pas explicitement plus loin
    cy.intercept('GET', '**/api/user/me', { statusCode: 401, body: {} }).as('meGuest');
  });

  it('permet à un utilisateur valide de se connecter via le formulaire (stub)', () => {
    // 1) /login -> 200
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake-jwt' },
    }).as('loginOk');

    // 2) après login, /me -> 200
    cy.intercept('GET', '**/api/user/me', {
      statusCode: 200,
      body: { id: 1, email: 'ui@stub', roles: ['USER'] },
    }).as('meAfter');

    cy.visit('/login');
    cy.get('input[formControlName="email"]').clear().type('user@example.com');
    cy.get('input[formControlName="password"]').clear().type('good-pass');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginOk').its('response.statusCode').should('eq', 200);
    cy.wait('@meAfter').its('response.statusCode').should('eq', 200);

    cy.contains(/se déconnecter/i, { timeout: 10000 }).should('be.visible');
  });

  it('refuse une connexion avec un mot de passe invalide (stub)', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { message: 'Bad credentials' },
    }).as('loginBad');

    cy.visit('/login');
    cy.get('input[formControlName="email"]').type('user@example.com');
    cy.get('input[formControlName="password"]').type('wrong');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginBad').its('response.statusCode').should('eq', 401);
    cy.location('pathname').should('include', '/login');
  });

  it('permet de se déconnecter (stub)', () => {
    // ⚠️ Important : on sert d’abord un /me = 200 et on ATTEND qu’il passe,
    // puis on switch sur un /me = 401 pour la suite.
    cy.intercept('GET', '**/api/user/me', {
      statusCode: 200,
      body: { id: 1, email: 'ui@stub', roles: ['USER'] },
    }).as('meBefore');

    cy.visit('/');
    cy.wait('@meBefore').its('response.statusCode').should('eq', 200);

    // On stubbe la route de logout si l’UI l’appelle
    cy.intercept('POST', '**/api/auth/logout', { statusCode: 204 }).as('logout');

    // Après le clic "Se déconnecter", l’app va reconsulter /me → on répond 401
    cy.intercept('GET', '**/api/user/me', { statusCode: 401, body: {} }).as('meAfter');

    cy.contains(/se déconnecter|logout/i, { timeout: 10000 }).click({ force: true });
    cy.wait('@logout', { timeout: 10000 }).its('response.statusCode').should('be.oneOf', [200, 204]);

    // On force un nouveau tour de /me
    cy.visit('/', { failOnStatusCode: false });
    cy.wait('@meAfter').its('response.statusCode').should('be.oneOf', [401, 403]);
  });
});
