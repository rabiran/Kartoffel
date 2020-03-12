import { config } from '../config/config';

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
        [config.elasticSearch.fullTextFieldName]: {
          analyzer: 'autocomplete',
          search_analyzer: 'autocomplete_search',
          type: 'text',
        },
      },
    },
    status: {
      type: 'keyword',
    },
    id: {
      enabled: false,
    },
    domainUsers: {
      properties: {
        name: { type: 'keyword' },
        domain: { type: 'keyword' },
        dataSource: { type: 'keyword' },
      },
    },
    identityCard: {
      enabled: false,
    },
    personalNumber: {
      enabled: false,
    },
    entityType: {
      type: 'keyword',
    },
    serviceType: {
      type: 'keyword',
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
      type: 'keyword',
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
      type: 'keyword',
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
