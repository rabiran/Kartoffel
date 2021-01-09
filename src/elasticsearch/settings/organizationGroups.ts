import { IndexSettings } from './indexSettings';
import { config } from '../../config/config';
const { indexNames: { organizationGroups: indexName }, fullTextFieldName } = config.elasticSearch;

const prefix_autocomplete_field_settings = {
  analyzer: 'autocomplete',
  search_analyzer: 'autocomplete_search',
  type: 'text',
};

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
        max_gram: 15,
        min_gram: 2,
        token_chars: ['letter'],
        type: 'edge_ngram',
      },
    },
  },
};


const mappings = {
  properties: {
    name: {
      type: 'keyword',
      fields: {
        [fullTextFieldName]: prefix_autocomplete_field_settings,
      },
    },
    hierarchy: {
      type: 'keyword',
      fields: {
        [fullTextFieldName]: prefix_autocomplete_field_settings,
      },
    },
    akaUnit: {
      type: 'keyword',
      fields : {
        [fullTextFieldName]: prefix_autocomplete_field_settings,
      },
    },
    isAlive: {
      type: 'boolean',
    },
    isALeaf: {
      type: 'boolean',
    },
    children: {
      enabled: false,
    },
    ancestors: {
      enabled: false,
    },
  },
};

const indexSettings: IndexSettings = {
  mappings,
  settings,
  name: indexName,
};

export default indexSettings;
