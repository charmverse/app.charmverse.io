const CUSTOM_DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9]{2,})+$/;

export function isValidDomainName(domain: string) {
  return CUSTOM_DOMAIN_REGEX.test(domain);
}
