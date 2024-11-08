// logic to easily replace our S3 domain to a new location
export function replaceS3Domain<T extends string | undefined | null>(url: T) {
  if (!url) return url;
  return url.replace('https://s3.amazonaws.com/charm.public/', 'https://cdn.charmverse.io/');
}
