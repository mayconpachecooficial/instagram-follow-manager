export const namePattern = /^(followers|following)(?:_(\d+))?\.(json|html)$/i

export function supportedFile(name: string) {
  return namePattern.test(name)
}
