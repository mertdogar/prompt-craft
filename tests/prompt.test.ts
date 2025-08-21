import { describe, it, expect } from 'vitest';
import { P, Prompt } from '../src/index';

describe('Prompt basics', () => {
  it('renders plain text with escaping', () => {
    const result = P.text('Hello *world* #1').render();
    expect(result).toBe('Hello \\*world\\* \\#1');
  });

  it('concats and joins', () => {
    const a = P.concat('Hello', P.space(), 'world');
    expect(a.render()).toBe('Hello world');

    const j = P.join(['a', 'b', 'c'], ', ');
    expect(j.render()).toBe('a, b, c');
  });

  it('inline helpers', () => {
    expect(P.bold('x').render()).toBe('**x**');
    expect(P.italic('x').render()).toBe('*x*');
    expect(P.strike('x').render()).toBe('~~x~~');
    expect(P.codeInline('a ` b').render()).toBe('`a \\` b`');
  });

  it('link escaping of )', () => {
    const r = P.link('site', 'https://example.com/a)b').render();
    expect(r).toBe('[site](https://example.com/a%29b)');
  });
});

describe('Blocks', () => {
  it('heading and paragraph add trailing newlines', () => {
    const h = P.heading(2, 'Title').render();
    expect(h.endsWith('\n\n')).toBe(true);
    const p = P.paragraph('Hello').render();
    expect(p).toBe('Hello\n\n');
  });

  it('code blocks fenced', () => {
    const code = P.codeBlock('console.log("hi")', 'ts').render();
    expect(code).toContain('```ts');
    expect(code.endsWith('\n\n')).toBe(true);
  });
});

describe('Lists', () => {
  it('unordered list basic', () => {
    const md = P.unorderedList(['a', 'b']).render();
    expect(md).toMatch(/- a\n\n- b\n/);
  });

  it('ordered list with start', () => {
    const md = P.orderedList(['a', 'b'], { start: 3 }).render();
    expect(md.startsWith('3. a')).toBe(true);
  });
});

describe('Instance chaining', () => {
  it('append and chain formatting', () => {
    const out = P.text('hello').append(P.space(), 'world').bold().render();
    expect(out).toBe('**hello world**');
  });
});

describe('Extend', () => {
  it('adds custom static builders that can use other helpers', () => {
    const MyP = P.extend({
      callout(title: any, body: any) {
        return this.concat(
          this.heading(3, title),
          this.blockquote(body)
        );
      }
    });
    const out = MyP.callout('Note', 'Use responsibly.').render();
    expect(out).toMatch(/### Note/);
    expect(out).toMatch(/^> Use responsibly\./m);
  });
});

