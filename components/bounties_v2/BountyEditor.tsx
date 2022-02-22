import { CompositeForm } from 'components/common/form/Form';
import { Bounty as IBounty } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { IInputField } from '../common/form/GenericInput';
import BountyService from './BountyService';

interface IBountyEditorInput {
  onSubmit: (bounty: IBounty) => any,
  mode?: 'create' | 'update'
  bounty?: IBounty
}

/**
 * For now, we are only passing prefill data to the text input field
 * @param bounty
 * @returns
 */
function bountyEditorFields (bounty?: IBounty): IInputField<IBounty> [] {
  return [
    {
      fieldType: 'text',
      modelKey: 'title',
      label: 'Bounty title',
      value: bounty?.title,
      required: true
    },
    /*
    {
      fieldType: 'text',
      modelKey: 'linkedTaskId',
      label: 'Linked task ID'
    },
    */
    {
      fieldType: 'textMultiline',
      modelKey: 'description',
      label: 'Extended bounty description'
    },
    /*
    {
      fieldType: 'charmEditor',
      modelKey: 'descriptionNodes'
    },

    {
      fieldType: 'collaborators',
      modelKey: 'reviewer'
    },
    {
      fieldType: 'collaborators',
      modelKey: 'assignee'
    },
    */
    {
      fieldType: 'number',
      modelKey: 'rewardAmount'
    },
    {
      fieldType: 'crypto',
      modelKey: 'rewardToken'
    }
  ];
}

export function BountyEditor ({ onSubmit, bounty, mode = 'create' }: IBountyEditorInput) {

  const [space] = useCurrentSpace();
  const [user] = useUser();

  async function submitted (value: IBounty) {
    if (mode === 'create') {
      delete (value as any).linkedTaskId;
      const createdBounty = await BountyService.createBounty(value as any);
      onSubmit(createdBounty as any);
    }
  }

  return (
    <div>
      <CompositeForm onSubmit={submitted} fields={bountyEditorFields(bounty)} />
    </div>
  );
}
