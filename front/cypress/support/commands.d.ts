/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginViaUI(email: string, password: string): Chainable<any>;
      registerViaUI(email: string, password: string, username: string): Chainable<any>;
      ensureUserViaAPI(email: string, password: string, username: string): Chainable<any>;
      loginProgrammatically(email: string, password: string): Chainable<any>;
    }
  }
}

export {};
