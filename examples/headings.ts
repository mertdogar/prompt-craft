import { Prompt as P } from "../src";

const doc = P.concat(
  P.heading(1, "Prompt-md Example: Headings"),
  P.paragraph(
    "You can create headings with different levels and append paragraphs.",
  ),
  P.heading(2, "Section A"),
  P.paragraph("This is section A content."),
  P.heading(3, "Subsection A.1"),
  P.paragraph("More details under A.1."),
);

console.log(doc.render());


