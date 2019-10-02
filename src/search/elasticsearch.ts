import { Client, ApiResponse } from '@elastic/elasticsearch';
import { config } from '../config/config';

const client = new Client({
  nodes: config.elasticSearch.nodes,
});

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
