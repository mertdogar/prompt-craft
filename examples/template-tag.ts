import { Prompt as P } from "../src";

const name = 'World';
const ticketId = 123;

const t = P.t`Hello ${name}, your ticket #${ticketId} is ${P.bold('open')}.`;

console.log(t.render());


