import rewiremock, { addPlugin, overrideEntryPoint, plugins } from 'rewiremock';

overrideEntryPoint(module);
addPlugin(plugins.protectNodeModules);
addPlugin(plugins.nodejs);

export { rewiremock };
