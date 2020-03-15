import { search as _search, ElasticSearchRepository } from '../search/elasticsearch';
import { queryParser, FieldContext } from '../search/queryBuilder';
import { IPerson, IDomainUser } from './person.interface';
import { config } from '../config/config';
import { DomainSeperator, domainMap } from '../utils';


const { personsIndexName, defaultResultLimit, fullTextFieldName } = config.elasticSearch;

const fieldContext = {
  fullName: FieldContext.Query,
  // the rest of the fields are treated as FieldContext.Filter by default
};

/**
 * 
 * @param queryObj 
 * @param size 
 */
const search = async (queryObj: object, size: number = defaultResultLimit) => {
  const query = queryParser(queryObj, fieldContext);
  const results = await _search<IPerson>(personsIndexName, size, query);
  return results.map(transformDomainUser);
};

const getIndexSettings = () => ({
  name: personsIndexName,
  settings: indexSettings,
  mappings: indexMappings,
});

/**
 * Transform each domain user in the person to it's display form, 
 * returns new person object with the transformed domain users
 * @param person
 * @returns new person object with the transformed domain users
 */
const transformDomainUser = (person: IPerson) => {
  const tPerson = { ...person };
  if (!tPerson.domainUsers) return tPerson;
  tPerson.domainUsers = (tPerson.domainUsers as IDomainUser[]).map((u) => {
    const user: Partial<IDomainUser> = {};
    user.uniqueID = `${u.name}${DomainSeperator}${u.domain}`;
    domainMap.get(u.domain) && (user.adfsUID = `${u.name}${DomainSeperator}${domainMap.get(u.domain)}`);
    user.dataSource = u.dataSource;
    return user as IDomainUser;    
  });
  return tPerson;
};

const indexSettings = {
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
        min_gram: 1,
        token_chars: ['letter'],
        type: 'edge_ngram',
      },
    },
  },
};

const indexMappings = {
  properties: {
    fullName: {
      type: 'keyword',
      fields: {
        [fullTextFieldName]: {
          analyzer: 'autocomplete',
          search_analyzer: 'autocomplete_search',
          type: 'text',
        },
      },
    },
    status: {
      type: 'keyword',
    },
    id: {
      enabled: false,
    },
    domainUsers: {
      properties: {
        name: { type: 'keyword' },
        domain: { type: 'keyword' },
        dataSource: { type: 'keyword' },
      },
    },
    identityCard: {
      enabled: false,
    },
    personalNumber: {
      enabled: false,
    },
    entityType: {
      type: 'keyword',
    },
    serviceType: {
      type: 'keyword',
    },
    firstName: {
      enabled: false,
    },
    lastName: {
      enabled: false,
    },
    cuurentUnit: {
      enabled: false,
    },
    dischargeDay: {
      enabled: false,
    },
    hierarchy: {
      enabled: false,
    },
    job: {
      enabled: false,
    },
    directGroup: {
      enabled: false,
    },
    managedGroup: {
      enabled: false,
    },
    responsibility: {
      type: 'keyword',
    },
    responsibilityLocation: {
      enabled: false,
    },
    mail: {
      enabled: false,
    },
    phone: {
      enabled: false,
    },
    mobilePhone: {
      enabled: false,
    },
    rank: {
      type: 'keyword',
    },
    address: {
      enabled: false,
    },
    clearance: {
      enabled: false,
    },
    createdAt: {
      enabled: false,
    }, 
    updatedAt: {
      enabled: false,
    },
  },
};

export default {
  search,
  getIndexSettings,
} as ElasticSearchRepository<IPerson>;
