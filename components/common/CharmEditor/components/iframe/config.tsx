import PreviewIcon from '@mui/icons-material/Preview';
import { FiFigma } from 'react-icons/fi';
import { TbBrandAirtable } from 'react-icons/tb';

export const MAX_EMBED_WIDTH = 700;
export const MIN_EMBED_WIDTH = 100;
export const MAX_EMBED_HEIGHT = 2500;
export const MIN_EMBED_HEIGHT = 200;

export const embeds = {
  embed: {
    icon: PreviewIcon,
    name: 'Embed',
    placeholder: 'https:...',
    text: 'Insert an embed'
  },
  airtable: {
    icon: TbBrandAirtable,
    name: 'Airtable',
    placeholder: 'https://www.airtable.com/...',
    text: 'Insert an Airtable embed'
  },
  dune: {
    iconUrl: '/images/dune_logo_bw.png',
    name: 'Dune',
    placeholder: 'https://dune.com/embeds/...',
    text: 'Insert analytics from Dune'
  },
  figma: {
    icon: FiFigma,
    name: 'Figma',
    placeholder: 'https://www.figma.com/file/...',
    text: 'Insert a Figma embed'
  },
  typeform: {
    iconUrl: '/images/typeform_logo.png',
    name: 'Typeform',
    placeholder: 'https://typeform.com/to/...',
    text: 'Insert a typeform embed'
  }
};

export type EmbedType = keyof typeof embeds;

export type IframeNodeAttrs = {
  src?: string;
  type: EmbedType;
  height: number;
  width: number;
};
