type Props = {
  spaceDomain: string;
  origin: string;
};

export function generateNotionImportRedirectUrl({ spaceDomain, origin }: Props): string {
  return `/api/notion/login?redirect=${encodeURIComponent(`${origin}/${spaceDomain}`)}`;
}
