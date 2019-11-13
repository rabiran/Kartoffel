import { Client, ApiResponse, ClientOptions } from '@elastic/elasticsearch';
import { config } from '../config/config';
import { personsIndexSettings } from './indexSettings';
import { ConnectionOptions } from 'tls';

/**
 * returns es client options 
 */
function getClientOpts(): ClientOptions {
  const opts: ClientOptions = {
    nodes: config.elasticSearch.nodes,
  };
  // add ssl opt
  if (config.elasticSearch.ssl.enabled) {
    const sslOpts: ConnectionOptions = {
      rejectUnauthorized: config.elasticSearch.ssl.rejectUnauthorized,
    };
    // add ca
    if (config.elasticSearch.ssl.ca) sslOpts.ca = config.elasticSearch.ssl.ca;
    // add pfx OR cert (priority to PFX)
    if (config.elasticSearch.ssl.pfx) sslOpts.pfx = config.elasticSearch.ssl.pfx;
    else if (config.elasticSearch.ssl.cert) {
      sslOpts.cert = config.elasticSearch.ssl.cert;
      if (config.elasticSearch.ssl.key) sslOpts.key = config.elasticSearch.ssl.key;
    }
    // add passphrase
    if (config.elasticSearch.ssl.passphrase) sslOpts.passphrase = config.elasticSearch.ssl.passphrase;
    // check whether to disable server identity check
    if (config.elasticSearch.ssl.disableServerIdenityCheck) {
      sslOpts.checkServerIdentity = (host, cert) => undefined;
    }
    opts.ssl = sslOpts;
  }
  // add auth opts
  if (config.elasticSearch.auth.username) {
    opts.auth = {
      username: config.elasticSearch.auth.username,
      password: config.elasticSearch.auth.password,
    };
  }
  return opts;
}

const client = new Client(getClientOpts());

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

/**
 * perform elasticsearch search
 * returns results array of type <T>
 * @param index the index to search in
 * @param size the maximum amount of results returned
 * @param query query body 
 */
export async function search<T>(index: string, size: number ,query: Object) {
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
 * initiallize the indexes needed to perform the search
 */
export async function initIndex() {
  if ((await client.indices.exists({ 
    index: config.elasticSearch.personsIndexName })).statusCode === 404) {
    await client.indices.create({
      index: config.elasticSearch.personsIndexName,
      body: personsIndexSettings,
    });
  }
}
