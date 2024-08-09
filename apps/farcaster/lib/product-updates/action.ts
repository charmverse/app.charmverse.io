'use server';

import type { ProductUpdatesFarcasterFrame } from '@charmverse/core/prisma-client';

import { actionClient } from 'lib/actionClient';

import { createProductUpdatesFrame } from './createFrame';
import { schema } from './schema';

export const createProductUpdatesFrameAction = actionClient
  .schema(schema)
  .action<ProductUpdatesFarcasterFrame>(async ({ parsedInput }) => {
    const productUpdatesFrame = await createProductUpdatesFrame(parsedInput);
    return productUpdatesFrame;
  });
