export function getFileData(data: DataTransfer, accept: string, multiple: boolean) {
  const dragDataItems = getMatchingItems(data.items, accept, multiple);
  const files: File[] = [];

  dragDataItems.forEach((item) => {
    const file = item && item.getAsFile();
    if (file == null) {
      return;
    }
    files.push(file);
  });

  return files;
}

function getMatchingItems(list: DataTransferItemList, accept: string, multiple: boolean) {
  const dataItems = Array.from(list);
  let results;

  // Return the first item (or undefined) if our filter is for all files
  if (accept === '') {
    results = dataItems.filter((item) => item.kind === 'file');
    return multiple ? results : [results[0]];
  }

  const accepts = accept
    .toLowerCase()
    .split(',')
    .map((_accept) => {
      return _accept.split('/').map((part) => part.trim());
    })
    .filter((acceptParts) => acceptParts.length === 2); // Filter invalid values

  const predicate = (item: DataTransferItem) => {
    if (item.kind !== 'file') {
      return false;
    }

    const [typeMain, typeSub] = item.type
      .toLowerCase()
      .split('/')
      .map((s) => s.trim());

    for (const [acceptMain, acceptSub] of accepts) {
      // Look for an exact match, or a partial match if * is accepted, eg image/*.
      if (typeMain === acceptMain && (acceptSub === '*' || typeSub === acceptSub)) {
        return true;
      }
    }
    return false;
  };

  results = dataItems.filter(predicate);
  if (multiple === false) {
    results = [results[0]];
  }

  return results;
}
