describe('LAKBAY LANAO Login', () => {

  it('should allow a user to log in', () => {

    cy.visit('http://localhost:5173/login')

    cy.get('input[type="email"]')
      .type('admin@gmail.com')

    cy.get('input[type="password"]')
      .type('lakbay2025')

    cy.contains('button', 'Log in').click()

    cy.url().should('include', '/admin/dashboard')

  })

})