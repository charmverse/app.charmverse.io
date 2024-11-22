import { prisma } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import type { BoardView, BoardViewFields } from '@root/lib/databases/boardView';
import type { Card } from '@root/lib/databases/card';
import type { ProposalBoardBlock } from '@root/lib/proposals/blocks/interfaces';
import { formatDate, formatDateTime } from '@root/lib/utils/dates';
import { stringify } from 'csv-stringify/sync';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { OctoUtils } from 'components/common/DatabaseEditor/octoUtils';
import { sortCards } from 'components/common/DatabaseEditor/store/cards';
import { blockToFBBlock } from 'components/common/DatabaseEditor/utils/blockUtils';
import { getDefaultBoard } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { mapProposalToCard } from 'components/proposals/ProposalPage/components/ProposalProperties/hooks/useProposalsBoardAdapter';
import { CardFilter } from 'lib/databases/cardFilter';
import { Constants } from 'lib/databases/constants';
import { PROPOSAL_STEP_LABELS } from 'lib/databases/proposalDbProperties';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { PROPOSAL_EVALUATION_TYPE_ID } from 'lib/proposals/blocks/constants';
import { getProposals } from 'lib/proposals/getProposals';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(exportProposalsHandler);

async function exportProposalsHandler(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const userId = req.session.user?.id;
  const csvContent = await exportProposals({ spaceId, userId });
  return res.status(200).send(csvContent);
}

export default withSessionRoute(handler);
