import { Client } from '@elastic/elasticsearch';

const client = new Client({ nodes: ['http://localhost:9200'] });

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
        min_gram: 2,
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
        autocomplete: {
          analyzer: 'autocomplete',
          search_analyzer: 'autocomplete_search',
          type: 'text',
        },
      },
    },
  },
};

export async function initIndex() {
  // todo: check index exists
  try {
    await client.indices.create({ 
      index: 'kartoffel.people',
      body: {
        settings,
        // mappings,
      },
    });
    const res = await client.indices.putMapping({
      index: 'kartoffel.people',
      body: mappings,
    });
    console.log(res);
  } catch (err) {
    console.log(err.meta.body);
  }
}
