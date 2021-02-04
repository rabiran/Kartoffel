import { config } from '../config/config';
import { Client, ClientOptions } from '@elastic/elasticsearch';
import { ConnectionOptions } from 'tls';


function configureClient(): ClientOptions {
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

const client = new Client(configureClient());

export default client;
