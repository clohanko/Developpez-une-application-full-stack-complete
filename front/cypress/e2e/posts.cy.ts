/// <reference types="cypress" />
/// <reference path="../support/commands.d.ts" />

// Un seul timestamp pour toute la spec
const TS = Date.now();
const email = `e2e+${TS}@example.com`;
const password = 'Abcd1234!'; 
const username = `e2e-${TS}`;       

before(() => {
  // Crée (ou ignore si déjà fait dans une relance) le même triplet (email, username, password)
  cy.ensureUserViaAPI(email, password, username);
});

beforeEach(() => {
  // Login programmatique avec les mêmes identifiants
  cy.visit('/', { failOnStatusCode: false });     // init window/localStorage
  cy.loginProgrammatically(email, password);
  // Vérifie état authentifié
  cy.intercept('GET', '**/api/user/me').as('me');
  cy.visit('/', { failOnStatusCode: false });
  cy.wait('@me').its('response.statusCode').should('eq', 200);
});

describe('Gestion des posts', () => {
  it('affiche la liste des posts (home)', () => {
    cy.visit('/');
    cy.get('body').then($b => {
      if ($b.find('.card__link').length) {
        cy.get('.card__link').first().should('have.attr', 'routerLink');
      } else {
        cy.contains(/aucun article|aucune publication/i).should('be.visible');
      }
    });
  });

  it('permet de créer un nouveau post', () => {
    cy.intercept('GET', '**/api/topics*').as('topics');
  
    cy.visit('/posts/new');
    cy.wait('@topics').its('response.statusCode').should('eq', 200);
  
    // Attendre au moins une option activée (non disabled)
    cy.get('select[formControlName="topicId"] option:not([disabled])', { timeout: 10000 })
      .should('have.length.at.least', 1);
  
    // Sélectionner par LIBELLÉ (texte visible) la première option valide
    cy.get('select[formControlName="topicId"]').then($select => {
      const firstLabel = $select.find('option:not([disabled])').first().text().trim();
      cy.wrap($select).select(firstLabel);
    });
  
    cy.get('input[formControlName="title"]').type('Titre E2E');
    cy.get('textarea[formControlName="content"]').type('Contenu E2E auto');
    cy.get('button.cta[type="submit"]').click();
  
    cy.location('pathname').should('match', /\/posts\/\d+$/);
  });
  
  it('permet d’ouvrir le détail d’un post existant', () => {
    cy.visit('/');
    cy.get('body').then($b => {
      if ($b.find('.card__link').length) {
        cy.get('.card__link').first().click();
        cy.location('pathname').should('match', /\/posts\/\d+$/);
      } else {
        // Pas de post ? On en crée un proprement
        cy.intercept('GET', '**/api/topics*').as('topics');
        cy.visit('/posts/new');
        cy.wait('@topics').its('response.statusCode').should('eq', 200);
  
        cy.get('select[formControlName="topicId"] option:not([disabled])', { timeout: 10000 })
          .should('have.length.at.least', 1);
  
        cy.get('select[formControlName="topicId"]').then($select => {
          const firstLabel = $select.find('option:not([disabled])').first().text().trim();
          cy.wrap($select).select(firstLabel);
        });
  
        cy.get('input[formControlName="title"]').type('Titre E2E 2');
        cy.get('textarea[formControlName="content"]').type('Contenu E2E 2');
        cy.get('button.cta[type="submit"]').click();
  
        cy.location('pathname').should('match', /\/posts\/\d+$/);
      }
    });
  });
  
});
