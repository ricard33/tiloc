import { template } from "./stringUtils";

describe("Module stringUtils:", () => {
  describe("template()", () => {
    it("should replace variables in string", () => {
      // eslint-disable-next-line no-template-curly-in-string
      expect(template("My name is ${name}, I'm ${age} years old.", {name: "John", age: 24}))
        .toEqual("My name is John, I'm 24 years old.")
    });
    it("accepts string without variable", () => {
      // eslint-disable-next-line no-template-curly-in-string
      expect(template("Simple string.", undefined))
        .toEqual("Simple string.")
    });
  });
});
