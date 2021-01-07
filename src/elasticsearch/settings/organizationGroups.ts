import { IndexSettings } from './indexSettings';
import { config } from '../../config/config';
const { indexNames: { organizationGroups: indexName }, fullTextFieldName } = config.elasticSearch;

const prefix_field_settings = {
  type: 'text',
  index_prefixes: {
    min_Chars: 2,
    max_chars: 15,
  },
};

const mappings = {
  properties: {
    name: {
      type: 'keyword',
      fields: {
        [fullTextFieldName]: prefix_field_settings,
      },
    },
    hierarchy: {
      type: 'keyword',
      fields: {
        [fullTextFieldName]: prefix_field_settings,
      },
    },
    akaUnit: {
      type: 'keyword',
      fields : {
        [fullTextFieldName]: prefix_field_settings,
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
  name: indexName,
};

export default indexSettings;
