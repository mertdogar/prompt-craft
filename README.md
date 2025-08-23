## prompt-craft

Tiny, immutable, chainable Markdown builder for LLM prompts. Compose safe Markdown using a small fluent API.

### Install

```bash
npm install @mertdogar/prompt-craft
```

### Quick start

```ts
import { P } from '@mertdogar/prompt-craft';

const doc = P.heading(2, 'Ticket Summary').append(
  P.paragraph(
    P.bold('Issue: ').append('Checkout fails on mobile.'),
    P.bold('Owner: ').append('Mert Doğar'),
  ),
  P.unorderedList([
    'Repro on iOS 18 / Safari',
    { content: 'Only happens with campaign code', children: [
      'Code applied via query param',
      'Not reproducible with manual input',
      P.bold('Tested on: ').append('iOS 18 / Safari')
    ]},
    'No errors in Sentry',
    P.codeBlock("console.log('Hello, world!')", 'ts'),
  ])
);

console.log(doc.render());
```

#### CommonJS usage

```js
const { P } = require('@mertdogar/prompt-craft');

const doc = P.heading(1, 'Hello').append(' world');
console.log(doc.render());
```

### API overview

- **Creation**: `P.from(x)`, `P.empty()`, `P.concat(...)`, `P.join(items, sep)`, `P.t\`template\``
- **Inline**: `P.text(s)`, `P.raw(s)`, `P.space()`, `P.lineBreak()`, `P.newline(n)`, `P.bold(x)`, `P.italic(x)`, `P.strike(x)`, `P.codeInline(x)`, `P.link(text, href)`
- **Blocks**: `P.heading(level, x)`, `P.paragraph(...parts)`, `P.blockquote(x)`, `P.codeBlock(code, lang)`, `P.horizontalRule()`
- **Lists**: `P.unorderedList(items, opts)`, `P.orderedList(items, opts)`
- **Tables**: `P.table(headers, rows, align)`
- **Conditionals**: `P.If({ condition, whenTrue, whenFalse })`, `P.Switch(value, branches)`
- **Collections**: `P.Map(items, (item, index) => node)`
#### Conditional rendering: P.If

Choose between two branches with a boolean or a function predicate. `undefined` is treated as false. `whenTrue` and `whenFalse` can be values, `P` nodes, or thunks that return them (evaluated lazily). `then`/`else` are still accepted for backward compatibility.

```ts
import { P } from '@mertdogar/prompt-craft';

const doc = P.If({
  condition: true, // or () => boolean
  whenTrue: P.heading(1, 'Hello'),
  whenFalse: P.heading(2, 'World'),
});

console.log(doc.render());
```

If `whenFalse`/`else` is omitted and the condition is false (or undefined), it yields empty output.

#### Switch statements: P.Switch

Choose between multiple branches based on a value. Returns the first matching case's content, or empty output if none match.

```ts
import { P } from '@mertdogar/prompt-craft';

const userType = 'admin';

const doc = P.Switch(userType, [
  { case: 'admin', content: P.heading(2, 'Admin Dashboard') },
  { case: 'user', content: P.heading(2, 'User Profile') },
  { case: 'guest', content: P.heading(2, 'Welcome') },
]);

console.log(doc.render());
// => ## Admin Dashboard
```

You can also use function predicates for more complex matching:

```ts
const score = 85;

const doc = P.Switch(score, [
  { case: (n: number) => n >= 90, content: P.paragraph('Grade: A') },
  { case: (n: number) => n >= 80, content: P.paragraph('Grade: B') },
  { case: (n: number) => n >= 70, content: P.paragraph('Grade: C') },
  { case: (n: number) => n >= 60, content: P.paragraph('Grade: D') },
]);

console.log(doc.render());
// => Grade: B
```

Content can be values, `P` nodes, or lazy functions that return them (evaluated only when matched).

#### Collections: P.Map

Map arrays into nodes and concatenate them.

```ts
import { P } from '@mertdogar/prompt-craft';

const array = [
  { title: 'Hello', description: 'World' },
  { title: 'Hello', description: 'World' },
];

const doc = P.Map(array, (item) => P.heading(3, item.title));
console.log(doc.render());
// =>
// ### Hello
//
// ### Hello
//
```

- **Instance chaining**: `p.append(...)`, `p.bold()`, `p.italic()`, `p.strike()`, `p.codeInline()`, `p.link(href)`, `p.render()`

Notes:
- `P.text` escapes inline Markdown specials while allowing existing Markdown via `P.raw`.
- Headings, paragraphs, code blocks, lists, and quotes end with two newlines by default for LLM-friendly spacing.

### Custom blocks (extension)

Create your own helpers with `P.extend(...)`:

```ts
import { P } from '@mertdogar/prompt-craft';

const MyP = P.extend({
  callout(title: any, body: any) {
    return this.concat(
      this.heading(3, title),
      this.blockquote(body)
    );
  },
});

const doc = MyP.callout('Note', 'Use responsibly.');
console.log(doc.render());
```

You can also use a builder function if you prefer capturing the base:

```ts
const MyP = P.extend(Base => ({
  warn(msg: any) {
    return Base.paragraph(Base.bold('Warning: ').append(msg));
  }
}));
```

### Examples

See files under `examples/`:
- `simple.ts`
- `headings.ts`
- `lists.ts`
- `blocks.ts`
- `template-tag.ts`
- `table.ts`
- `extend.ts`
- `map.ts`
- `if.ts`
- `switch.ts`

Run all examples:

```bash
npm run examples
```

### Testing

```bash
npm i
npm test
```

### TypeScript

Ships with TypeScript types. `P` is an alias for `Prompt`.

### License

GPL-3.0. See `LICENSE`. Repository: https://github.com/mertdogar/prompt-craft


