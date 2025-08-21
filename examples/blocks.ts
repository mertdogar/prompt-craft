import { Prompt as P } from "../src";

const doc = P.concat(
  P.heading(2, "Blocks"),
  P.blockquote(P.concat(
    "This is a quoted paragraph.",
    P.lineBreak(),
    "Spanning multiple lines."
  )),
  P.codeBlock("SELECT * FROM users WHERE id = 1;", 'sql'),
  P.horizontalRule(),
  P.paragraph("After the rule."),
);

console.log(doc.render());


