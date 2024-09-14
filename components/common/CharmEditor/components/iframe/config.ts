import PreviewIcon from '@mui/icons-material/Preview';
import type { ElementType } from 'react';
import { FiFigma } from 'react-icons/fi';
import { RiGoogleFill } from 'react-icons/ri';
import { SiLoom, SiOdysee } from 'react-icons/si';
import { TbBrandAirtable } from 'react-icons/tb';

export { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT } from './constants';

export const MIN_EMBED_WIDTH = 100;
export const MAX_EMBED_HEIGHT = 2500;

export type Embed = {
  icon?: ElementType;
  keywords?: string[];
  iconUrl?: string;
  name: string;
  placeholder: string;
  text: string;
  convertURLToEmbed?(url: string): string;
  urlTest?(url: string): boolean;
  heightRatio?: number;
};

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
    iconUrl: '/images/logos/dune_logo_bw.png',
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
  google: {
    icon: RiGoogleFill,
    name: 'Google Forms',
    placeholder: 'https://docs.google.com/forms/...',
    text: 'Insert a Google form',
    // requires ?embedded=true to be at the end
    convertURLToEmbed(url: string) {
      if (!url.includes('embedded=true')) {
        if (url.includes('?')) {
          url += '&embedded=true';
        } else {
          url += '?embedded=true';
        }
      }
      return url;
    },
    // example: https://docs.google.com/forms/d/e/1FAIpQLSf-Z7e_l7htY7DO6GQuzkW2KWsqUOcXjzLS2fwvWnapvfltEQ/viewform
    urlTest(url: string) {
      return url.includes('docs.google.com/forms') && url.includes('/viewform');
    }
  },
  loom: {
    icon: SiLoom,
    name: 'Loom',
    keywords: ['video'],
    placeholder: 'https://www.loom.com/...',
    text: 'Insert a Loom embed',
    // example input: https://www.loom.com/share/d0e3f7b3abb6448eb0c7a00bdd6dcd90
    convertURLToEmbed(url: string) {
      return url.replace('share', 'embed');
    },
    urlTest(url: string) {
      return url.includes('www.loom.com');
    },
    heightRatio: 1.63
  },
  odysee: {
    icon: SiOdysee,
    name: 'Odysee',
    keywords: ['video'],
    placeholder: 'https://odysee.com/...',
    text: 'Insert an Odysee embed',
    // example input: https://odysee.com/@Coldfusion:f/google-panics-over-chatgpt-the-ai-wars:a
    // How to embed Odysee: https://odysee.com/@brent:d/automatic-embedding-of-odysee-videos-on-websites:4
    convertURLToEmbed(url: string) {
      const urlParts = new URL(url.replace('/$/embed', '')).pathname.split('/').filter(Boolean);
      const channel = urlParts[0]?.replace(':', '#');
      const video = urlParts[1]?.replace(':', '#');
      return `https://odysee.com/$/embed/${video}/${channel}`;
    },
    urlTest(url: string) {
      return url.includes('odysee.com');
    },
    heightRatio: 560 / 315
  },
  typeform: {
    iconUrl: '/images/logos/typeform_logo.png',
    name: 'Typeform',
    placeholder: 'https://typeform.com/to/...',
    text: 'Insert a typeform embed',
    urlTest(url: string) {
      return url.includes('typeform.com');
    }
  }
};
// doesn't compile due to next.js - https://github.com/vercel/next.js/issues/43799
// } satisfies Record<string, Embed>;

export type EmbedType = keyof typeof embeds;

export type IframeNodeAttrs = {
  src?: string;
  type: EmbedType;
  height: number;
  width: number;
};
