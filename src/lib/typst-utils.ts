/**
 * Escapes special Typst markup characters so plain text renders without syntax errors.
 */
export function escapeTypstText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/@/g, '\\@')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\~')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/=/g, '\\=');
}

/**
 * Converts standard plain text into a valid formatted Typst document.
 */
export function formatTextToTypst(rawText: string): string {
  if (!rawText || rawText.trim() === '') {
    return `#set page(paper: "a4")\n\n`;
  }

  const lines = rawText.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    // If already looks like a Typst directive/heading, leave intact
    if (trimmed.startsWith('#') || trimmed.startsWith('=')) {
      return line;
    }
    return escapeTypstText(line);
  });

  const escapedContent = processedLines.join('\n');

  // If header setup is missing, prepend standard template setup
  if (!escapedContent.includes('#set page')) {
    return `#set page(
  paper: "a4",
  margin: (x: 2cm, y: 2.5cm),
)
#set text(
  font: "Liberation Sans",
  size: 11pt,
)

${escapedContent}`;
  }

  return escapedContent;
}
