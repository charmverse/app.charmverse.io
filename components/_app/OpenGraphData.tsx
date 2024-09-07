import { charmBlue as blueColor } from '@root/config/colors';

export type OpenGraphProps = {
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
};

const defaults = {
  description: 'The Network for Onchain Communities. Manage grants. Connect with builders. Forge new ideas.',
  title: 'CharmVerse',
  image: 'https://app.charmverse.io/images/logo_black_lightgrey_opengraph.png'
};

export function OpenGraphData({ description, title, image, canonicalUrl }: OpenGraphProps) {
  const displayedDescription = description ?? defaults.description;
  const displayedTitle = title || defaults.title;
  const displayedImage = image ?? defaults.image;

  return (
    <>
      <meta name='theme-color' content={blueColor} />
      <link rel='icon' href='/favicon.png' />
      {displayedDescription && <meta name='description' content={displayedDescription} />}
      {canonicalUrl && <link rel='canonical' href={canonicalUrl} />}
      <meta property='og:title' content={displayedTitle} />
      <meta property='og:image' content={displayedImage} />

      <meta property='og:description' content={displayedDescription} />
      <meta property='twitter:title' content={displayedTitle} />
      <meta property='twitter:description' content={displayedDescription} />
      <meta property='twitter:image' content={displayedImage} />
    </>
  );
}
