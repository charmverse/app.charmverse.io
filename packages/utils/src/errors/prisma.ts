export function isUniqueConstraintError(error: unknown) {
  return hasErrorCode(error, 'P2002');
}

export function hasErrorCode(error: unknown, code: string) {
  if (error && typeof error === 'object' && 'code' in error) {
    return error.code === code;
  }

  return false;
}
