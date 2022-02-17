import { v4 as uuid } from 'uuid';
import { useState } from 'react';
import { DialogTitle, Modal } from 'components/common/Modal';
import { Plugin } from '@bangle.dev/core';
import { Typography, Box } from '@mui/material';
import { Editor } from 'components/editor';
import FieldLabel from 'components/settings/FieldLabel';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { useUser } from 'hooks/useUser';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import PrimaryButton from 'components/common/PrimaryButton';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { Bounty, BOUNTY_STATUSES, BountyStatus } from 'models/Bounty';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { CryptoCurrency, CryptoCurrencyList } from 'models/Currency';
import getDisplayName from 'lib/users/getDisplayName';
import { usePages } from 'hooks/usePages';
import BlocksEditor from 'pages/[domain]/[pageId]';

interface IToken {
  symbol: string;
  img: string;
}

const CRYPTO_CURRENCY_LIST = Object.keys(CryptoCurrencyList) as CryptoCurrency[];

type ModalType = 'create' | 'edit' | 'suggest';

interface Props {
  open: boolean;
  modalType: ModalType;
  bounty?: Bounty;
  onClose: () => void;
  onSubmit: (bounty: Bounty) => void;
}

const modalTitles: Record<ModalType, string> = {
  suggest: 'Suggest a Bounty',
  create: 'Create a Bounty',
  edit: 'Edit a Bounty'
};

export const descSchema = yup.object({
  type: yup.string(),
  content: yup.array()
});

export const schema = yup.object({
  author: yup.string().required(),
  title: yup.string().ensure().trim().lowercase()
    .required('Title is required'),
  description: descSchema,
  type: yup.string().required().trim(),
  status: yup.mixed<BountyStatus>().oneOf([...BOUNTY_STATUSES]).required(),
  reviewer: yup.string().ensure().trim(),
  assignee: yup.string().ensure().trim(),
  rewardToken: yup.mixed<CryptoCurrency>().oneOf(CRYPTO_CURRENCY_LIST).required(),
  rewardAmount: yup.number().required()
});

export type FormValues = yup.InferType<typeof schema>;

export default function BountyModal (props: Props) {
  const { open, onClose, onSubmit: _onSubmit, modalType, bounty } = props;
  const [user] = useUser();

  return (
    <Modal size='large' open={open} onClose={onClose}>
      <DialogTitle onClose={onClose}>{modalTitles[modalType]}</DialogTitle>

    </Modal>
  );
}
