import { IndexSettings } from './indexSettings';
import { config } from '../../config/config';
import { analyzers, tokenizers, prefix_autocomplete_field_settings } from './commonSettings';
const { indexNames: { organizationGroups: indexName }, fullTextFieldName } = config.elasticSearch;

const { autocomplete, autocomplete_search } = analyzers;
const { edge_ngram_tokenizer } = tokenizers;

const settings = {
  analysis: {
    analyzer: {
      autocomplete,
      autocomplete_search,
    },
    tokenizer: {
      edge_ngram_tokenizer,
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
    ancestors: {
      type: 'keyword',
    },
    isAlive: {
      type: 'boolean',
    },
    isALeaf: {
      type: 'boolean',
    },
    createdAt: {
      type: 'date',
    }, 
    updatedAt: {
      type: 'date',
    },
    children: {
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
