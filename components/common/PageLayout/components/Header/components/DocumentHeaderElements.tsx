import type { PageType } from '@charmverse/core/prisma';

import { documentTypes } from 'components/common/PageActions/components/DocumentPageActionList';

import { DocumentParticipants } from './DocumentParticipants';
import EditingModeToggle from './EditingModeToggle';
import { ShareButton } from './ShareButton/ShareButton';
import { ToggleEvaluationButton } from './ToggleEvaluationButton';

type Props = {
  headerHeight: number;
  page: {
    deletedAt?: string | Date | null;
    id: string;
    type: string;
  };
  isInsideDialog?: boolean;
};

export function DocumentHeaderElements({ headerHeight, isInsideDialog, page }: Props) {
  const { deletedAt, id, type } = page;
  const isBasePageDocument = documentTypes.includes(type as PageType);
  return (
    <>
      {isBasePageDocument && <DocumentParticipants />}
      {isBasePageDocument && <EditingModeToggle />}
      {!deletedAt && <ShareButton headerHeight={headerHeight} pageId={id} />}
      {type === 'proposal' && <ToggleEvaluationButton isInsideDialog={isInsideDialog} pageId={id} />}
    </>
  );
}
