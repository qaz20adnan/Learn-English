import type { ReactNode } from 'react';

/**
 * A deliberately small Markdown renderer covering the subset used by lesson
 * content (headings, bold, inline code, lists, tables and blockquotes).
 *
 * It produces React elements rather than an HTML string, so nothing is injected
 * with `dangerouslySetInnerHTML`.
 */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return <span key={index}>{part}</span>;
  });
}

const isList = (line: string) => /^\d+\.\s/.test(line) || line.startsWith('- ');
const isBlockStart = (line: string) =>
  line.startsWith('#') ||
  line.startsWith('|') ||
  line.startsWith('> ') ||
  isList(line);

export function renderMarkdown(markdown: string): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith('|')) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i]);
        i += 1;
      }
      const cells = rows.map((row) =>
        row
          .split('|')
          .slice(1, -1)
          .map((cell) => cell.trim()),
      );
      const header = cells[0] ?? [];
      const body = cells.slice(2);
      blocks.push(
        <table key={key++}>
          <thead>
            <tr>
              {header.map((cell, index) => (
                <th key={index}>{renderInline(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{renderInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push(<h2 key={key++}>{renderInline(line.slice(3))}</h2>);
      i += 1;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push(<h1 key={key++}>{renderInline(line.slice(2))}</h1>);
      i += 1;
      continue;
    }
    if (line.startsWith('> ')) {
      blocks.push(<blockquote key={key++}>{renderInline(line.slice(2))}</blockquote>);
      i += 1;
      continue;
    }
    if (isList(line)) {
      const ordered = /^\d+\.\s/.test(line);
      const items: string[] = [];
      while (i < lines.length && isList(lines[i])) {
        items.push(lines[i].replace(/^(\d+\.\s|-\s)/, ''));
        i += 1;
      }
      const ListTag = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag key={key++}>
          {items.map((item, index) => (
            <li key={index}>{renderInline(item)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      paragraph.push(lines[i]);
      i += 1;
    }
    blocks.push(<p key={key++}>{renderInline(paragraph.join(' '))}</p>);
  }

  return blocks;
}
