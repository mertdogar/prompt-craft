import { Prompt as P } from "../src";

const parameter = 'option1'

const doc = P.concat(
  P.heading(2, "Switch examples"),
  P.Switch(parameter, [{
    case: 'option1',
    content: P.paragraph("Hello 1"),
  }, {
    case: 'option2',
    content: P.paragraph("Hello 2"),
  }])
);

console.log(doc.render());


