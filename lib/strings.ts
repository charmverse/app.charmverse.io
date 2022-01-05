
export function fancyTrim (text: string = '', maxLength: number = 40) {
  text ||= '';
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

export function fancyTrimWords (text: string = '', maxWords: number = 40) {
  text ||= '';
  const words = text.split(' ');
  if (words.length <= maxWords) {
    return text;
  }
  return words.slice(0, maxWords).join(' ') + '...';
}


// example: https://google.com/search?q=3531422 -> https://google.com
export function getDomain (url: string, includeProtocol?: boolean) {
  if (!url.includes('http')) {
    // invalid url, oh well
    return url;
  }
  const pathArray = url.split( '/' );
  const protocol = pathArray[0];
  const host = pathArray[2];
  if (includeProtocol)
    return protocol + '//' + host;
  return host;
}
