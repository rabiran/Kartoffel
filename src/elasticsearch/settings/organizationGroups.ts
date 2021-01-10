import { IndexSettings } from './indexSettings';
import { config } from '../../config/config';
import { analyzers, tokenizers, prefix_autocomplete_field_settings } from './commonSettings';
const { indexNames: { organizationGroups: indexName }, fullTextFieldName } = config.elasticSearch;

const { autocomplete, autocomplete_search, path_hierarchy } = analyzers;
const { custom_path_hierarchy, edge_ngram_tokenizer } = tokenizers;

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
    hierarchyPath: {
      type: 'text',
      analyzer: 'path_hierarchy',
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
    createdAt: {
      type: 'date',
    }, 
    updatedAt: {
      type: 'date',
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
