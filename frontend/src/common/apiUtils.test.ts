import { fetchErrorDecode } from "./apiUtils";

describe("apiUtils", function() {
  it("fetchErrorDecode", () => {
    expect(fetchErrorDecode(parsingError)).toEqual("SyntaxError: Unexpected token P in JSON at position 0");
    expect(fetchErrorDecode(notFoundError)).toEqual("Pas trouvé.");
    expect(fetchErrorDecode(validationError)).toEqual('{"description":["Ce champ est obligatoire."],"method":["Ce champ est obligatoire."]}');
  });

});

const notFoundError = {
  status: 404,
  data: {
    detail: "Pas trouvé."
  }
};

const validationError = {
  status: 400,
  data: {
    description: ["Ce champ est obligatoire."],
    method: ["Ce champ est obligatoire."],
  }
};

const parsingError = {
  status: "PARSING_ERROR",
  originalStatus: 500,
  data: "Proxy error: Could not proxy request /api/payment/….1:3000 to http://localhost:8000/ (ECONNREFUSED).",
  error: "SyntaxError: Unexpected token P in JSON at position 0"
};
