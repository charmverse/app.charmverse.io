type DatadogQueryOptions = {
  logMessage?: string;
  pageIds?: string[];
};

function constructDatadogQuery(options: DatadogQueryOptions): string {
  const { logMessage, pageIds } = options;
  const queryParts: string[] = [];

  if (logMessage) {
    queryParts.push(`"${logMessage}"`);
  }

  if (pageIds && pageIds.length > 0) {
    const pageIdQuery = pageIds.map((id) => `@pageId:${id}`).join(' OR ');
    queryParts.push(`(${pageIdQuery})`);
  }

  return queryParts.join(' AND ');
}
