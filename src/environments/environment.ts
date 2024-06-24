import pkg from '@@/package.json';

import { Environment } from './';

export const environment: Environment = {
  production: false,
  testing: false,
  debug: true,
  baseHref: '/',
  version: `${pkg.version} (dev)`,
};
