import { Prompt as P } from "../src";

const doc = P.concat(
  P.heading(2, "If examples"),
  P.If({
    condition: true,
    whenTrue: P.heading(3, "Hello"),
    whenFalse: P.heading(3, "World"),
  }),
  P.If({
    condition: () => 1 + 1 === 3,
    whenTrue: () => P.paragraph("What"),
  }),
  P.unorderedList([
    P.raw("test"),
    P.raw("test"),
    P.If({
      condition: () => 1 + 1 === 3,
      whenTrue: () => P.paragraph("What"),
    }),
    P.raw("test"),
  ]),
  P.If({
    condition: false,
    whenTrue: P.paragraph("This will not show"),
    whenFalse: P.paragraph("Else branch when false"),
  }),
  P.If({
    condition: () => 1 + 1 === 2,
    whenTrue: () => P.paragraph("Function predicate works (true)"),
    whenFalse: () => P.paragraph("Function predicate works (false)"),
  }),
);

console.log(doc.render());


