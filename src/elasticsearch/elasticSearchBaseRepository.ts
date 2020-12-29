import { Client, ApiResponse } from '@elastic/elasticsearch';
import defaultEsClient from './elasticSearchClient';
import { config } from '../config/config';

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

export interface QueryConfig {
  resultSize: number;
}

const { defaultResultLimit } = config.elasticSearch;

const defaultQueryConfig: QueryConfig = {
  resultSize: defaultResultLimit,
};

export abstract class ElasticSearchBaseRepository<T> {
  protected _client: Client;
  protected _queryConfig: QueryConfig;
  protected _indexName: string;

  constructor(
    indexName: string,
    elasticClient: Client = defaultEsClient, 
    queryConfig: QueryConfig = defaultQueryConfig
  ) {
    this._indexName = indexName;
    this._client = elasticClient;
    this._queryConfig = queryConfig;
  }

  protected async search(query: Object, size: number = this._queryConfig.resultSize) {
    const res: ApiResponse<SearchResponse<T>> = await this._client.search({
      size,
      body: query,
      index: this._indexName,
    });
    if (res.statusCode === 200) {
      return res.body.hits.hits.map(hit => hit._source);
    }
    return [];
  }

  public async findById(id: any) {
    const res = await this._client.get({
      id,
      index: this._indexName,
    });
    return res.body._source as T;
  }
}
