export const getFilenameWithExtension = (path: string, fallbackExtension = 'jpg'): string => {
  const pathParts = path.split('/');
  const rawName = pathParts.pop() || '';
  const [name, extension] = rawName.split('.');

  return `${pathParts.join('/')}/${name}.${extension?.toLowerCase() || fallbackExtension}`;
};
