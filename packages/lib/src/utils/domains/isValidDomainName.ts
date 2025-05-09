export function isValidDomainName(domain: string) {
  // Basic checks for protocol and port
  if (domain.includes('://') || domain.includes(':')) {
    return false;
  }

  // Split the domain into its parts
  const parts = domain.split('.');

  // Each part must be at least 2 characters long
  if (parts.some((part) => part.length < 2)) {
    return false;
  }

  // Validate each part
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Each part should only contain alphanumeric characters and hyphens
    if (!/^[a-zA-Z0-9-]+$/.test(part)) {
      return false;
    }

    // Hyphens should not be at the start or end of any part
    if (part.startsWith('-') || part.endsWith('-')) {
      return false;
    }
  }

  return true;
}
