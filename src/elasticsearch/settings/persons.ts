import { config } from '../../config/config';
import { IndexSettings } from './indexSettings';
import { analyzers, tokenizers, prefix_autocomplete_field_settings } from './commonSettings';

const { indexNames: { persons: indexName }, fullTextFieldName } = config.elasticSearch;
const { autocomplete, autocomplete_search, path_hierarchy } = analyzers;
const { edge_ngram_tokenizer, custom_path_hierarchy } = tokenizers;

const settings = {
  analysis: {
    analyzer: {
      autocomplete,
      autocomplete_search,
      path_hierarchy, 
    },
    tokenizer: {
      edge_ngram_tokenizer,
      custom_path_hierarchy,
    },
  },
};

const mappings = {
  properties: {
    fullName: {
      type: 'keyword',
      fields: {
        [fullTextFieldName]: prefix_autocomplete_field_settings,
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
    pictures: {
      properties: {
        profile: {
          properties: {
            url: { enabled: false },
            meta: {
              properties: {
                takenAt: { enabled: false },
                updatedAt: { enabled: false },
                format: { enabled: false },
                path: { enabled: false },
              },
            },
          },
        },
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
    hierarchyPath: {
      type: 'text',
      analyzer: 'path_hierarchy',
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
