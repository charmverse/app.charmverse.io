/**
 * Turn string literals into single line, removing spaces at start of line
 */

export function noSpaceTmp(...values: any) {
  const tmpStrings = Array.from(values.shift());

  let combined = '';
  while (tmpStrings.length > 0 || values.length > 0) {
    if (tmpStrings.length > 0) {
      combined += tmpStrings.shift();
    }
    if (values.length > 0) {
      combined += values.shift();
    }
  }

  let out = '';
  combined.split('\n').forEach((line) => {
    out += line.replace(/^\s*/g, '');
  });
  return out;
}
