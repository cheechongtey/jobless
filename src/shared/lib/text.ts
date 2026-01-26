export function normalizeText(input: string) {
  return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

export async function convertTextToMarkdown(input: string) {
  const md = input
    // headings
    .replace(/\n([A-Z][^\n]{3,})\n/g, "\n## $1\n")
    // bullet points
    .replace(/\n•\s+/g, "\n- ")
    // numbered lists
    .replace(/\n(\d+)\.\s+/g, "\n$1. ");

  return md.trim();
}
