export type MDInput = string | number | boolean | MDRenderable | null | undefined;

export interface MDRenderable {
  render(): string;
  toString(): string;
}

const isRenderable = (x: unknown): x is MDRenderable =>
  !!x && typeof (x as any).render === "function";

const toRenderable = (x: MDInput): MDRenderable => {
  if (x == null) return new MD(""); // empty
  if (isRenderable(x)) return x;
  return new MD(escapeInline(String(x)));
};

// --- Escaping helpers --------------------------------------------------------

/**
 * Escapes Markdown inline specials in plain text contexts.
 * (We keep it conservative so your existing Markdown can pass through if needed.)
 */
function escapeInline(s: string): string {
  // Escape just the most common troublemakers for bold/italic/lists/links
  return s
    .replace(/([\\`*_{}\[\]()#+\-!>])/g, "\\$1");
}

// Code blocks should be left as-is. We still fence the block safely.
function fence(code: string, lang?: string) {
  const fenceLine = "```";
  const safe = code.replace(/```/g, "``\\`");
  return `${fenceLine}${lang ?? ""}\n${safe}\n${fenceLine}`;
}

// --- Core node ---------------------------------------------------------------

/** Simple node that holds pre-rendered Markdown (assumed safe/escaped) */
class MD implements MDRenderable {
  constructor(private readonly text: string) {}
  render() { return this.text; }
  toString() { return this.render(); }
}

/** Composite node of children */
class Group implements MDRenderable {
  constructor(private readonly children: MDRenderable[]) {}
  render() { return this.children.map(c => c.render()).join(""); }
  toString() { return this.render(); }
}

// --- List building -----------------------------------------------------------

export type ListItemInput = MDInput | {
  content: MDInput;
  children?: ListItemInput[];
};

export interface ListOptions {
  bullet?: "-" | "*" | "+";   // unordered
  start?: number;              // ordered list start
  tight?: boolean;             // omit blank lines between items
  indent?: number;             // spaces per nesting level (default 2)
}

function renderList(
  items: ListItemInput[],
  ordered: boolean,
  opts: ListOptions = {}
): MDRenderable {
  const bullet = opts.bullet ?? "-";
  const indent = Math.max(0, opts.indent ?? 2);
  const start = Math.max(ordered ? (opts.start ?? 1) : 1, 1);

  const lines: string[] = [];
  const tight = !!opts.tight;

  const walk = (nodes: ListItemInput[], level: number, startNum: number) => {
    let index = startNum;
    for (const node of nodes) {
      const { content, children } = normalizeListItem(node);
      const pad = " ".repeat(level * indent);
      const marker = ordered ? `${index}.` : bullet;

      // Render content; allow multi-line by indenting subsequent lines
      const rendered = toRenderable(content).render();
      const [first, ...rest] = rendered.split("\n");
      lines.push(`${pad}${marker} ${first}`);
      for (const r of rest) {
        lines.push(`${pad}${" ".repeat(marker.length + 1)}${r}`);
      }

      if (children && children.length) {
        walk(children, level + 1, ordered ? 1 : 1);
      }

      if (!tight) lines.push(""); // blank line between items (common LLM-friendly)
      index++;
    }
  };

  walk(items, 0, start);

  // Remove trailing blank line
  while (lines.length && lines[lines.length - 1] === "") lines.pop();

  return new MD(lines.join("\n") + (lines.length ? "\n" : ""));
}

function normalizeListItem(x: ListItemInput): { content: MDInput; children?: ListItemInput[] } {
  if (x && typeof x === "object" && !isRenderable(x) && "content" in x) {
    return { content: (x as any).content, children: (x as any).children };
  }
  return { content: x };
}

// --- Public API --------------------------------------------------------------

export class Prompt implements MDRenderable {
  private readonly node: MDRenderable;

  private constructor(node: MDRenderable) {
    this.node = node;
  }

  static from(input: MDInput): Prompt {
    return new Prompt(toRenderable(input));
  }

  /** Create an empty document */
  static empty(): Prompt {
    return new Prompt(new MD(""));
  }

  /** Combine items without separators */
  static concat(...items: MDInput[]): Prompt {
    return new Prompt(new Group(items.map(toRenderable)));
  }

  /** Join items with a separator (string or node) */
  static join(items: MDInput[], sep: MDInput): Prompt {
    const parts: MDRenderable[] = [];
    items.forEach((it, i) => {
      if (i > 0) parts.push(toRenderable(sep));
      parts.push(toRenderable(it));
    });
    return new Prompt(new Group(parts));
  }

  /** Tagged template for ergonomic composition: Prompt.t`Hello ${name}!` */
  static t(strings: TemplateStringsArray, ...values: MDInput[]) {
    const out: MDRenderable[] = [];
    strings.forEach((s, i) => {
      out.push(new MD(s));
      if (i < values.length) out.push(toRenderable(values[i]));
    });
    return new Prompt(new Group(out));
  }

  // --- Inline helpers ---

  static text(s: string) { return new Prompt(new MD(escapeInline(s))); }

  static raw(s: string) { return new Prompt(new MD(s)); } // trust caller

  static space() { return new Prompt(new MD(" ")); }

  static lineBreak() { return new Prompt(new MD("  \n")); } // Markdown soft break (two spaces + newline)

  static newline(n: number = 1) { return new Prompt(new MD("\n".repeat(Math.max(1, n)))); }

  /**
   * Emphasis helpers that preserve leading/trailing whitespace by placing it
   * outside the formatting markers. This avoids sequences like `**text **next`
   * which many Markdown parsers treat as invalid or render without the space.
   */
  private static wrapWithDelimiters(open: string, close: string, input: MDInput): Prompt {
    const s = toRenderable(input).render();
    const match = s.match(/^(\s*)([\s\S]*?)(\s*)$/) as RegExpMatchArray | null;
    const leading = match ? match[1] : "";
    const core = match ? match[2] : s;
    const trailing = match ? match[3] : "";
    return new Prompt(new MD(`${leading}${open}${core}${close}${trailing}`));
  }

  static bold(x: MDInput)  { return Prompt.wrapWithDelimiters("**", "**", x); }

  static italic(x: MDInput){ return Prompt.wrapWithDelimiters("*", "*", x); }

  static strike(x: MDInput){ return Prompt.wrapWithDelimiters("~~", "~~", x); }

  static codeInline(x: MDInput){
    const s = isRenderable(x) ? x.render() : String(x ?? "");
    const match = s.match(/^(\s*)([\s\S]*?)(\s*)$/) as RegExpMatchArray | null;
    const leading = match ? match[1] : "";
    const core = match ? match[2] : s;
    const trailing = match ? match[3] : "";
    const escapedCore = core.replace(/`/g, "\\`");
    return new Prompt(new MD(`${leading}\`${escapedCore}\`${trailing}`));
  }

  static link(text: MDInput, href: string){
    const t = toRenderable(text).render();
    const safeHref = href.replace(/\)/g, "%29"); // very light safety
    return new Prompt(new MD(`[${t}](${safeHref})`));
  }

  // --- Blocks ---

  static heading(level: 1|2|3|4|5|6, x: MDInput) {
    const lvl = Math.min(6, Math.max(1, level));
    return new Prompt(new MD(`${"#".repeat(lvl)} ${toRenderable(x).render()}\n\n`));
  }

  static paragraph(...parts: MDInput[]) {
    const content = new Group(parts.map(toRenderable)).render();
    return new Prompt(new MD(`${content}\n\n`));
  }

  static blockquote(x: MDInput) {
    const rendered = toRenderable(x).render().split("\n").map(l => `> ${l}`).join("\n");
    return new Prompt(new MD(rendered + "\n\n"));
  }

  static codeBlock(code: string, lang?: string) {
    return new Prompt(new MD(fence(code, lang) + "\n\n"));
  }

  static horizontalRule() {
    return new Prompt(new MD(`---\n\n`));
  }

  // --- Lists ---

  static unorderedList(items: ListItemInput[], opts: Omit<ListOptions, "start"> = {}) {
    return new Prompt(renderList(items, false, opts));
  }

  static orderedList(items: ListItemInput[], opts: ListOptions = {}) {
    return new Prompt(renderList(items, true, opts));
  }

  // --- Tables (minimal) ---

  static table(headers: string[], rows: (MDInput[])[], align: ("left"|"center"|"right")[] = []) {
    const esc = (s: MDInput) => toRenderable(s).render().replace(/\|/g, "\\|");
    const header = `| ${headers.map(h => esc(h)).join(" | ")} |`;
    const divider = `| ${headers.map((_, i) => {
      const a = align[i];
      if (a === "left") return ":---";
      if (a === "right") return "---:";
      if (a === "center") return ":---:";
      return "---";
    }).join(" | ")} |`;
    const body = rows.map(r => `| ${r.map(esc).join(" | ")} |`).join("\n");
    return new Prompt(new MD(header + "\n" + divider + "\n" + body + "\n\n"));
  }

  // --- Collections ---

  static Map<T>(items: T[], map: (item: T, index: number) => MDInput) {
    const children = (items ?? []).map((it, i) => toRenderable(map(it, i)));
    return new Prompt(new Group(children));
  }

  // --- Conditionals ---

  static If(opts: {
    condition: boolean | undefined | (() => boolean | undefined);
    whenTrue?: MDInput | (() => MDInput);
    whenFalse?: MDInput | (() => MDInput);
    // Back-compat aliases (deprecated)
    then?: MDInput | (() => MDInput);
    else?: MDInput | (() => MDInput);
  }) {
    const cond = typeof opts.condition === "function" ? (opts.condition as () => boolean | undefined)() : opts.condition;
    const evalInput = (x: MDInput | (() => MDInput) | undefined): MDInput => (typeof x === "function" ? (x as () => MDInput)() : (x as MDInput));
    const truthy = opts.whenTrue ?? opts.then;
    const falsy = opts.whenFalse ?? opts.else;
    const chosen: MDInput = cond ? evalInput(truthy ?? null) : evalInput(falsy ?? null);
    return new Prompt(toRenderable(chosen));
  }

  /**
   * Extend with custom static builders. Returns a new class that inherits all
   * existing helpers plus your custom ones.
   *
   * Usage:
   *   const MyP = P.extend({
   *     callout(title: MDInput, body: MDInput) {
   *       return this.concat(
   *         this.heading(3, title),
   *         this.blockquote(body)
   *       );
   *     }
   *   });
   *
   * Or with a builder function to capture the Base class explicitly:
   *   const MyP = P.extend(Base => ({
   *     warn(msg: MDInput) { return Base.paragraph(Base.bold('Warning: ').append(msg)); }
   *   }));
   */
  static extend<T, C extends typeof Prompt>(this: C, ext: (Base: C) => T & ThisType<C & T>): C & T;
  static extend<T extends Record<string, any>, C extends typeof Prompt>(this: C, ext: T & ThisType<C & T>): C & T;
  static extend(this: any, ext: any): any {
    const Base = this;
    class Extended extends Base {}
    const extras = typeof ext === "function" ? ext(Extended) : ext;
    return Object.assign(Extended, extras);
  }

  // --- Instance (chain) API --------------------------------------------------

  /** Append items (returns a new Prompt, original is unchanged) */
  append(...items: MDInput[]): Prompt {
    return new Prompt(new Group([this.node, ...items.map(toRenderable)]));
  }

  /** Wrap current content as **bold** */
  bold(): Prompt {
    return Prompt.bold(this);
  }

  italic(): Prompt { return Prompt.italic(this); }

  strike(): Prompt { return Prompt.strike(this); }

  codeInline(): Prompt { return Prompt.codeInline(this); }

  link(href: string): Prompt { return Prompt.link(this, href); }

  // Render
  render(): string { return this.node.render(); }
  toString(): string { return this.render(); }
}

// --- Convenience alias for outside usage
export const P = Prompt;