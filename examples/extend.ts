import { Prompt as P } from "../src";

// Object form: `this` is the extended class, so you can call existing helpers
const MyP = P.extend({
  callout(title: any, body: any) {
    return this.concat(
      this.heading(3, title),
      this.blockquote(body)
    );
  },
});

// Function form: capture Base explicitly
const WithWarn = P.extend(Base => ({
  warn(msg: any) {
    return Base.paragraph(Base.bold("Warning: ").append(msg));
  }
}));

const doc = P.concat(
  MyP.callout("Note", "Use responsibly."),
  WithWarn.warn("This is experimental.")
);

console.log(doc.render());


