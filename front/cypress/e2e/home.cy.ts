/// <reference types="cypress" />

describe('Page d’accueil', () => {
  it('s’affiche correctement pour un utilisateur connecté (feed vide)', () => {
    cy.intercept('GET', '**/api/user/me', {
      statusCode: 200,
      body: { id: 1, email: 'cypress@local', roles: ['USER'] },
    }).as('me');

    cy.intercept('GET', '**/api/feed*', {
      statusCode: 200,
      body: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
        numberOfElements: 0,
        pageable: { pageNumber: 0, pageSize: 10 },
      },
    }).as('feed');

    cy.visit('/');
    cy.wait(['@me', '@feed']);
    // Contenu minimal de la home (évite un texte trop spécifique)
    cy.get('app-navbar, header, nav').should('exist');
  });

  it('affiche la home pour un invité', () => {
    cy.intercept('GET', '**/api/user/me').as('me401');
    cy.visit('/');
    cy.wait('@me401').its('response.statusCode').should('be.oneOf', [401, 403]);

    // On reste bien sur la home, pas de formulaire de login inline
    cy.location('pathname').should('eq', '/');
    cy.get('input[formControlName="email"]').should('not.exist');
  });
});
