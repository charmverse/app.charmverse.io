/* eslint-disable import/no-extraneous-dependencies */
import fs from 'node:fs/promises';

import {
  createComposite,
  readEncodedComposite,
  writeEncodedComposite,
  writeEncodedCompositeRuntime
} from '@composedb/devtools-node';
import type { Ora as OraSpinner } from 'ora';
import ora from 'ora';

import { getCeramicClient } from './authenticate';

const folder = 'background/ceramicServer';

function getCompositesFolder(filename: string) {
  return `${folder}/generated/${filename}`;
}

export const compositeDefinitionFile = getCompositesFolder('composite-definition.json');

/**
 * @param {Ora} spinner - to provide progress status.
 * @return {Promise<void>} - return void when composite finishes deploying.
 */
export async function writeComposite({ spinner }: { spinner: OraSpinner } = { spinner: ora() }) {
  const ceramic = await getCeramicClient();

  const result = await fs.readdir(getCompositesFolder('')).catch(() => null);

  if (!result) {
    await fs.mkdir(getCompositesFolder(''));
  }

  const testComposite = await createComposite(ceramic, `${folder}/credentials.gql`);
  await writeEncodedComposite(testComposite, compositeDefinitionFile);

  spinner.info('creating composite for runtime usage');
  await writeEncodedCompositeRuntime(ceramic, compositeDefinitionFile, getCompositesFolder('composite-definition.js'));
  spinner.info('deploying composite');
  const deployComposite = await readEncodedComposite(ceramic, compositeDefinitionFile);

  await deployComposite.startIndexingOn(ceramic);
  spinner.succeed('composite deployed & ready for use');
}
