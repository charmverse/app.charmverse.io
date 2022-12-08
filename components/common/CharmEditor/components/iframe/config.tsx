import PreviewIcon from '@mui/icons-material/Preview';
import { FiFigma } from 'react-icons/fi';
import { SiLoom } from 'react-icons/si';
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
    text: 'Insert an Airtable embed',
    convertURLToEmbed(url: string) {
      if (url.includes('embed')) {
        return url; // already embeddable
      }
      const shareId = url.split('/').pop();
      return `https://airtable.com/embed/${shareId}`;
    },
    urlTest(url: string) {
      return url.includes('airtable.com');
    }
  },
  dune: {
    iconUrl: '/images/dune_logo_bw.png',
    name: 'Dune',
    placeholder: 'https://dune.com/embeds/...',
    text: 'Insert analytics from Dune',
    urlTest(url: string) {
      return url.includes('dune.com');
    }
  },
  figma: {
    icon: FiFigma,
    name: 'Figma',
    placeholder: 'https://www.figma.com/file/...',
    text: 'Insert a Figma embed',
    convertURLToEmbed(url: string) {
      return `https://www.figma.com/embed?embed_host=charmverse&url=${url}`;
    },
    urlTest(url: string) {
      return url.includes('www.figma.com');
    }
  },
  loom: {
    icon: SiLoom,
    name: 'Loom',
    placeholder: 'https://www.loom.com/...',
    text: 'Insert a Loom embed',
    // example input: https://www.loom.com/share/d0e3f7b3abb6448eb0c7a00bdd6dcd90
    convertURLToEmbed(url: string) {
      return url.replace('share', 'embed');
    },
    urlTest(url: string) {
      return url.includes('www.loom.com');
    }
  }
};

export type EmbedType = keyof typeof embeds;

export type IframeNodeAttrs = {
  src?: string;
  type: EmbedType;
  height: number;
  width: number;
};
