/**
 * Clean up and normalize graph-node unsuppported chars.
 */
export function normalize(str: string): string {
  if (str.length === 1 && str.charCodeAt(0) === 0) return ''

  return str
    .split('')
    .map<string>((char: string): string => char.charCodeAt(0) === 0 ? '\ufffd' : char)
    .join('')
}
