// Utilitaires partagés pour les specs
export function seedUserViaUI() {
    const email = `e2e+${Date.now()}@example.com`;
    const password = 'e2e-password-123';
    const username = 'e2e-user';
  
    Cypress.env('E2E_EMAIL', email);
    Cypress.env('E2E_PASSWORD', password);
  
    cy.registerViaUI(email, password, username);
  }
  