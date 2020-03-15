import { Client, ApiResponse, ClientOptions } from '@elastic/elasticsearch';
import { config } from '../config/config';
import { ConnectionOptions } from 'tls';

export interface ElasticSearchRepository<T> {
  search(query: object, size?: number): Promise<T[]>;
  getIndexSettings(): IndexSettings; 
}

interface IndexSettings {
  name: string;
  settings?: object;
  mappings?: object;
}

interface ShardsResponse {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
}

interface Explanation {
  value: number;
  description: string;
  details: Explanation[];
}

interface SearchResponse<T> {
  took: number;
  timed_out: boolean;
  _scroll_id?: string;
  _shards: ShardsResponse;
  hits: {
    total: number;
    max_score: number;
    hits: {
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: T;
      _version?: number;
      _explanation?: Explanation;
      fields?: any;
      highlight?: any;
      inner_hits?: any;
      matched_queries?: string[];
      sort?: string[];
    }[];
  };
  aggregations?: any;
}

let client: Client = null;

/**
 * returns es client options 
 */
function getClientOpts(): ClientOptions {
  const { nodes, ssl, auth } = config.elasticSearch;
  const opts: ClientOptions = {
    nodes,
  };

  // add ssl opt
  if (ssl.enabled) {
    const sslOpts: ConnectionOptions = {
      rejectUnauthorized: ssl.rejectUnauthorized,
    };
    // add ca
    if (ssl.ca) sslOpts.ca = ssl.ca;
    // add pfx OR cert (priority to PFX)
    if (ssl.pfx) sslOpts.pfx = ssl.pfx;
    else if (ssl.cert) {
      sslOpts.cert = ssl.cert;
      if (ssl.key) sslOpts.key = ssl.key;
    }
    // add passphrase
    if (ssl.passphrase) sslOpts.passphrase = ssl.passphrase;
    // check whether to disable server identity check
    if (ssl.disableServerIdenityCheck) {
      sslOpts.checkServerIdentity = (host, cert) => undefined;
    }
    opts.ssl = sslOpts;
  }
  // add auth opts
  if (auth.username) {
    opts.auth = {
      username: auth.username,
      password: auth.password,
    };
  }
  return opts;
}

export function initClient() {
  client = new Client(getClientOpts());
}

/**
 * perform elasticsearch search
 * returns results array of type <T>
 * @param index the index to search in
 * @param size the maximum amount of results returned
 * @param query query body 
 */
export async function search<T>(index: string, size: number, query: Object) {
  const res: ApiResponse<SearchResponse<T>> = await client.search({
    index,
    size,
    body: query,
  });
  if (res.statusCode === 200) {
    return res.body.hits.hits.map(hit => hit._source);
  }
  return [];
}

/**
 * initiallize an index specified in the index settings
 * needed to perform the search
 * @param indexSettings index name and ElasticSearch 
 * settings (such as: Mappings, analyzers ... etc.)
 */
export async function initIndex(indexSettings: IndexSettings) {
  const { name, settings = {}, mappings = {} } = indexSettings;
  if ((await client.indices.exists({ index: name })).statusCode === 404) {
    await client.indices.create({
      index: name,
      body: { settings, mappings },
    });
  }
}
