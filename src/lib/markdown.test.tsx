import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderMarkdown } from './markdown';

function renderInto(markdown: string) {
  return render(<div>{renderMarkdown(markdown)}</div>);
}

describe('renderMarkdown', () => {
  it('renders headings', () => {
    renderInto('# Title\n## Section');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Section');
  });

  it('renders bold and inline code without injecting HTML', () => {
    renderInto('Use **reliable** and `exact` words.');
    expect(screen.getByText('reliable').tagName).toBe('STRONG');
    expect(screen.getByText('exact').tagName).toBe('CODE');
  });

  it('renders unordered and ordered lists', () => {
    renderInto('- one\n- two\n\n1. first\n2. second');
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('renders blockquotes', () => {
    renderInto('> practice daily');
    expect(screen.getByText('practice daily').closest('blockquote')).not.toBeNull();
  });

  it('renders tables with a header and body rows', () => {
    renderInto('| A | B |\n| --- | --- |\n| 1 | 2 |');
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getAllByRole('cell')).toHaveLength(2);
  });

  it('merges consecutive lines into a single paragraph', () => {
    const { container } = renderInto('line one\nline two');
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toHaveTextContent('line one line two');
  });

  it('does not interpret raw HTML as markup', () => {
    const { container } = renderInto('<script>alert(1)</script>');
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });
});
