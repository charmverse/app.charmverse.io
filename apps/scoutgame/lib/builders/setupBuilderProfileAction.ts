'use server';

import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { authSecret } from '@root/config/constants';
import { unsealData } from 'iron-session';
import { cookies } from 'next/headers';

import { authActionClient } from 'lib/actions/actionClient';

import { setupBuilderProfileSchema } from './config';
import { setupBuilderProfile } from './setupBuilderProfile';

export const setupBuilderProfileAction = authActionClient
  .metadata({ actionName: 'setup_builder_profile' })
  .schema(setupBuilderProfileSchema)
  .action(async ({ parsedInput }) => {
    const inviteCodeCookie = cookies().get('invite-code');
    let inviteCode: string | null = null;
    if (inviteCodeCookie) {
      try {
        const inviteCodeData = (await unsealData(inviteCodeCookie.value, {
          password: authSecret as string
        })) as {
          inviteCode: string;
        };
        inviteCode = inviteCodeData.inviteCode;
      } catch (error) {
        //
      }
    }

    const { code, state } = parsedInput;
    const builder = await setupBuilderProfile({ code, state, inviteCode });

    trackUserAction('connect_github_success', {
      userId: builder.id
    });

    if (inviteCode) {
      cookies().set('invite-code', '', {
        maxAge: 0
      });
    }
  });
