export function includePagePermissionsWithSource() {
  return {
    permissions: {
      include: {
        sourcePermission: true
      }
    }
  };
}
