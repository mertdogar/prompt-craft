import { Prompt as P } from "../src";

const list = P.unorderedList([
  P.bold("Features:"),
  { content: "List items can be nested", children: [
    "First child",
    { content: P.italic("Second child with italic"), children: [
      P.codeBlock("console.log('nested')", 'ts')
    ]}
  ]},
  "Supports tight or loose spacing",
], { tight: false });

console.log(list.render());


