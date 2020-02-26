const personsSettings = {
  analysis: {
    analyzer: {
      autocomplete: {
        filter: ['lowercase'],
        tokenizer: 'edge_ngram_tokenizer',
        type: 'custom',
      },
      autocomplete_search: {
        tokenizer: 'lowercase',
      },
    },
    tokenizer: {
      edge_ngram_tokenizer: {
        max_gram: 10,
        min_gram: 1,
        token_chars: ['letter'],
        type: 'edge_ngram',
      },
    },
  },
};

const personsMappings = {
  properties: {
    fullName: {
      type: 'keyword',
      fields: {
        autocomplete: {
          analyzer: 'autocomplete',
          search_analyzer: 'autocomplete_search',
          type: 'text',
        },
      },
    },
    status: {
      type: 'text',
    },
    id: {
      enabled: false,
    },
    domainUsers: {
      enabled: false,
    },
    identityCard: {
      enabled: false,
    },
    personalNumber: {
      enabled: false,
    },
    entityType: {
      enabled: false,
    },
    serviceType: {
      enabled: false,
    },
    firstName: {
      enabled: false,
    },
    lastName: {
      enabled: false,
    },
    cuurentUnit: {
      enabled: false,
    },
    dischargeDay: {
      enabled: false,
    },
    hierarchy: {
      enabled: false,
    },
    job: {
      enabled: false,
    },
    directGroup: {
      enabled: false,
    },
    managedGroup: {
      enabled: false,
    },
    responsibility: {
      enabled: false,
    },
    responsibilityLocation: {
      enabled: false,
    },
    mail: {
      enabled: false,
    },
    phone: {
      enabled: false,
    },
    mobilePhone: {
      enabled: false,
    },
    rank: {
      enabled: false,
    },
    address: {
      enabled: false,
    },
    clearance: {
      enabled: false,
    },
    createdAt: {
      enabled: false,
    }, 
    updatedAt: {
      enabled: false,
    },
  },
};

export const personsIndexSettings = {
  settings: personsSettings,
  mappings: personsMappings,
};
