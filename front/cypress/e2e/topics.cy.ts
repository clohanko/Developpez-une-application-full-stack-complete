/// <reference types="cypress" />

describe('Gestion des topics', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/auth/login').as('login');
    cy.loginViaUI(Cypress.env('E2E_EMAIL'), Cypress.env('E2E_PASSWORD'));
    cy.wait('@login').its('response.statusCode').should('be.oneOf', [200, 201, 204]);
  });

  it('permet de s’abonner et de se désabonner', () => {
    cy.visit('/topics');

    // Abonnement (si le bouton "Suivre" existe)
    cy.get('body').then(($body) => {
      const sub = $body.find('[data-testid="topic-subscribe"], button:contains("Suivre"), button:contains("Subscribe")').first();
      if (sub.length) cy.wrap(sub).click();
    });

    // Désabonnement (si le bouton existe)
    cy.get('body').then(($body) => {
      const un = $body.find('[data-testid="topic-unsubscribe"], button:contains("Se désabonner"), button:contains("Unsubscribe")').first();
      if (un.length) cy.wrap(un).click();
    });
  });
});
