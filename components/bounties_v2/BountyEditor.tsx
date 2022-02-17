import BountyModal from 'components/bounties/BountyModal';
import { useForm } from 'react-hook-form';

import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { PageContent } from 'models';
import { CompositeForm } from 'components/common/form/Form';

import BangleEditor, { IBangleEditorOutput } from 'components/editor/BangleEditor';
import { Bounty as IBounty } from 'models/Bounty';

import BountyService from './BountyService';
import { IInputField } from '../common/form/GenericInput';

interface IBountyEditorInput {
  onSubmit: () => any,
  mode: 'create' | 'update'
  bounty?: IBounty
}

function bountyEditorFields (): IInputField<IBounty> [] {
  return [
    {
      fieldType: 'text',
      modelKey: 'title',
      label: 'Bounty title'
    },
    {
      fieldType: 'task',
      modelKey: 'linkedTaskId',
      label: 'Linked task'
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

  async function createBounty (bountyToCreate: Partial<IBounty>) {

    const created = await BountyService.createBounty(bountyToCreate);
    onSubmit();
  }

  async function updateBounty (bountyToCreate: Partial<IBounty>) {

    const created = await BountyService.createBounty(bountyToCreate);
    onSubmit();
  }

  function submitted (value: IBounty): void {

    console.log('Submitted values', value);
  }

  return (
    <div>
      <h1>Bounty Editor</h1>

      <CompositeForm onSubmit={submitted} fields={bountyEditorFields()} />
    </div>
  );
}
