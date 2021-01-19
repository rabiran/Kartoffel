import indexes from './settings';
import client from './elasticSearchClient';

/**
 * initiallize the indexes specified in settings.
 * does nothing for an index that is already exists.
 */
export async function initElasticIndexes() {
  for (const indexSettings of indexes) {
    const { name, settings = {}, mappings = {} } = indexSettings;
    if ((await client.indices.exists({ index: name })).statusCode === 404) {
      await client.indices.create({
        index: name,
        body: { settings, mappings },
      });
    }
  }
}
