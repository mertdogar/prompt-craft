import { Prompt as P } from "../src";

const doc =
  P.heading(2, "Ticket Summary")
    .append(
      P.paragraph(
        P.bold("Issue: ").append("Checkout fails on mobile."),
        P.bold("Owner: ").append("Mert Doğar")
      ),
      P.unorderedList([
        "Repro on iOS 18 / Safari",
        { content: "Only happens with campaign code", children: [
          "Code applied via query param",
          "Not reproducible with manual input",
          P.bold("Tested on: ").append("iOS 18 / Safari")
        ]},
        "No errors in Sentry",
        P.codeBlock("console.log('Hello, world!')", 'typescript'),

      ])
    );

const prompt = doc.render();

console.log(prompt);