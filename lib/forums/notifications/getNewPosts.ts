import type { Post, Space, User } from '@prisma/client';

import { prisma } from 'db';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { shortenHex } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';

import type { ForumTask, ForumTasksGroup } from '../comments/interface';
