export const hyphenatedToRegular = (text: string): string => {
  // Regular expression to match hyphenated words
  const pattern = /(?:^|\b)([a-z])/g;

  // Replace matched letters with capitalized letters
  return text.replace(pattern, (_, p1) => {
    return p1.toUpperCase();
  }).replace(/-/g, ' ');
}

const Enum = (
  { enumValue }: { enumValue?: string }
) => {
  if ( !enumValue ) {
    return <span>Not Set</span>;
  }

  return <span>{hyphenatedToRegular(enumValue)}</span>;
}

export default Enum;
