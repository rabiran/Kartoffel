export const prefix_autocomplete_field_settings = {
  analyzer: 'autocomplete',
  search_analyzer: 'autocomplete_search',
  type: 'text',
};

export const analyzers = {
  autocomplete: {
    filter: ['lowercase'],
    tokenizer: 'edge_ngram_tokenizer',
    type: 'custom',
  },
  autocomplete_search: {
    tokenizer: 'lowercase',
  },
  path_hierarchy: {
    tokenizer: 'custom_path_hierarchy',
  },
};

export const tokenizers = {
  edge_ngram_tokenizer: {
    max_gram: 15,
    min_gram: 2,
    type: 'edge_ngram',
    token_chars: [
      'letter',
      'digit',
    ],
  },
  custom_path_hierarchy: {
    type: 'path_hierarchy',
    delimeter: '/',
  },
};
