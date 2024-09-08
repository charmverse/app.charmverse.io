import { createComposite, readEncodedComposite, writeEncodedComposite } from '@composedb/devtools-node';
import ora from 'ora';

import { getCeramicClient } from './authenticate';

const folder = 'apps/ceramic';

function getCompositesFolder(filename: string) {
  return `${folder}/generated/${filename}`;
}

export const compositeDefinitionFile = getCompositesFolder('composite-definition.json');

/**
 * One off method for generating the ceramic composite
 */
export async function writeCompositeJson() {
  const spinner = ora();
  const ceramic = await getCeramicClient();

  spinner.info('creating composite for runtime usage');

  const compositeGraphQLDefinition = await createComposite(ceramic, `${folder}/src/credentials.gql`);
  await writeEncodedComposite(compositeGraphQLDefinition, compositeDefinitionFile);
}

/**
 * Deploy composite to the target server
 */
export async function deployComposite() {
  const ceramic = await getCeramicClient();
  const spinner = ora();
  const deployableComposite = await readEncodedComposite(ceramic, compositeDefinitionFile);
  spinner.info('deploying composite');

  await deployableComposite.startIndexingOn(ceramic);

  spinner.succeed('composite deployed & ready for use');
}
