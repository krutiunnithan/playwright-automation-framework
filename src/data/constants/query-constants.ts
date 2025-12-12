export const SoqlQueries = {
  Contact: {
    GET_SINGLE_CONTACT: `SELECT Id, FirstName, LastName, Email, Phone FROM Contact LIMIT 1`,
    GET_RECENT: (limit: number = 10): string =>
      `SELECT Id, FirstName, LastName, Email, CreatedDate FROM Contact ORDER BY CreatedDate DESC LIMIT ${limit}`,
    GET_COUNT: `SELECT COUNT() FROM Contact`,
  },

  Case: {
    GET_SINGLE_CASE: `SELECT Id, CaseNumber, Subject, Status, Priority FROM Case LIMIT 1`,
    GET_RECENT: (limit: number = 10): string =>
      `SELECT Id, CaseNumber, Subject, Status, Priority FROM Case ORDER BY CreatedDate DESC LIMIT ${limit}`,
    GET_COUNT: `SELECT COUNT() FROM Case`,
  },
};