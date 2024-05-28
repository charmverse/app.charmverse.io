import { blueColor } from 'theme/colors';

export type OpenGraphProps = {
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
};

export function OpenGraphData({ description, title, image, canonicalUrl }: OpenGraphProps) {
  const displayedDescription = description;

  const displayedTitle = title || 'CharmVerse';

  const displayedImage = image ?? 'https://app.charmverse.io/images/logo_black_lightgrey_opengraph.png';

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
