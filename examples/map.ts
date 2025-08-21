import { Prompt as P } from "../src";

const array = [
  { title: "Hello", description: "World" },
  { title: "Hello", description: "World" },
];

const doc = P.concat(
  P.Map(array, (item) => P.heading(3, item.title)),
);

console.log(doc.render());


