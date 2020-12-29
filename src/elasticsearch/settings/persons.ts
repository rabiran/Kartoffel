import { config } from '../../config/config';
import { IndexSettings } from './indexSettings';

const { indexNames: { persons: indexName }, fullTextFieldName } = config.elasticSearch;

const settings = {
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

const mappings = {
  properties: {
    fullName: {
      type: 'keyword',
      fields: {
        [fullTextFieldName]: {
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
      type: 'keyword',
    },
    personalNumber: {
      type: 'keyword',
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
    currentUnit: {
      enabled: false,
    },
    dischargeDay: {
      type: 'date',
    },
    hierarchy: {
      type: 'keyword',
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
      type: 'date',
    }, 
    updatedAt: {
      type: 'date',
    },
  },
};

const indexSettings: IndexSettings = {
  settings,
  mappings,
  name: indexName,
};

export default indexSettings;
