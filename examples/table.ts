import { Prompt as P } from "../src";

const table = P.table(
  ['Feature', 'Supported'],
  [
    ['Headings', 'Yes'],
    ['Inline (bold/italic/code)', 'Yes'],
    ['Lists', 'Yes'],
    ['Tables', 'Yes'],
  ],
  ['left', 'center']
);

console.log(table.render());


