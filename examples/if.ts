import { Prompt as P } from "../src";

const doc = P.concat(
  P.heading(2, "If examples"),
  P.If({
    condition: true,
    then: P.heading(3, "Hello"),
    else: P.heading(3, "World"),
  }),
  P.If({
    condition: false,
    then: P.paragraph("This will not show"),
    else: P.paragraph("Else branch when false"),
  }),
  P.If({
    condition: () => 1 + 1 === 2,
    then: () => P.paragraph("Function predicate works (true)"),
    else: () => P.paragraph("Function predicate works (false)"),
  }),
);

console.log(doc.render());


