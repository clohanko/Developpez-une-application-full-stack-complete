it('ping baseUrl', () => {
    cy.log('BASE = ' + Cypress.config('baseUrl'));
    cy.request({ url: '/', failOnStatusCode: false })
      .its('status')
      .should('be.oneOf', [200, 301, 302, 401, 403]);
  });
  