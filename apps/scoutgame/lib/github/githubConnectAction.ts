'use server';

import { authActionClient } from 'lib/actions/actionClient';

import { githubConnectSchema } from './config';
import { githubConnect } from './githubConnect';

export const githubConnectAction = authActionClient
  .metadata({ actionName: 'github_connect' })
  .schema(githubConnectSchema)
  .action(async ({ parsedInput }) => {
    const { code, state } = parsedInput;
    await githubConnect({ code, state });
  });
