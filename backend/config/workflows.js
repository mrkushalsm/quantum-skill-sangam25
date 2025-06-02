module.exports = {
  grievance: {
    stages: ['Submitted', 'UnderReview', 'Resolved'],
    transitions: {
      submit: { from: 'Draft', to: 'Submitted' },
      review: { from: 'Submitted', to: 'UnderReview' },
      resolve: { from: 'UnderReview', to: 'Resolved' }
    }
  },
  application: {
    stages: ['Draft', 'Submitted', 'Processing', 'Approved'],
    transitions: {
      submit: { from: 'Draft', to: 'Submitted' },
      process: { from: 'Submitted', to: 'Processing' },
      approve: { from: 'Processing', to: 'Approved' }
    }
  }
};
