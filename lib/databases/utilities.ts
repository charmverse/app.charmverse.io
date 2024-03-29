export function filterInternalProperties<T>(propertyMap: Record<string, any>): T {
  return Object.entries(propertyMap).reduce((acc, [key, value]) => {
    if (key.startsWith('__')) {
      return acc;
    }

    return { ...acc, [key]: value };
  }, {} as T);
}
