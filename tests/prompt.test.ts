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

describe('Conditionals', () => {
  it('If with boolean true chooses then', () => {
    const md = P.If({
      condition: true,
      then: P.heading(1, 'Hello'),
      else: P.heading(2, 'World')
    }).render();
    expect(md).toMatch(/^# Hello\n\n$/);
  });

  it('If with boolean false chooses else', () => {
    const md = P.If({
      condition: false,
      then: P.heading(1, 'Hello'),
      else: P.heading(2, 'World')
    }).render();
    expect(md).toMatch(/^## World\n\n$/);
  });

  it('If with function predicate', () => {
    const md = P.If({
      condition: () => 2 + 2 === 4,
      then: () => P.paragraph('OK'),
      else: () => P.paragraph('NO')
    }).render();
    expect(md).toBe('OK\n\n');
  });

  it('If without else yields empty when false', () => {
    const md = P.If({
      condition: () => false,
      then: P.paragraph('Shown')
    }).render();
    expect(md).toBe('');
  });

  it('If with undefined condition treated as false', () => {
    const md = P.If({
      // @ts-expect-error testing undefined allowed at runtime
      condition: undefined as any,
      then: P.paragraph('Yes'),
      else: P.paragraph('No'),
    }).render();
    expect(md).toBe('No\n\n');
  });

  it('If with undefined returned from predicate treated as false', () => {
    const md = P.If({
      condition: () => undefined,
      then: P.paragraph('Yes'),
      else: P.paragraph('No'),
    }).render();
    expect(md).toBe('No\n\n');
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

describe('Collections', () => {
  it('Map maps items to nodes and concatenates', () => {
    const data = [
      { title: 'A' },
      { title: 'B' },
    ];
    const md = P.Map(data, (it) => P.heading(3, it.title)).render();
    expect(md).toBe('### A\n\n### B\n\n');
  });

  it('Map handles empty arrays', () => {
    const md = P.Map<any>([], (it) => P.paragraph(String(it))).render();
    expect(md).toBe('');
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

