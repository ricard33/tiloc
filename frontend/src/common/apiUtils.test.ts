import { fetchErrorDecode } from "./apiUtils";
import { QueryError } from "../services/api";

describe("apiUtils", function() {
  it("fetchErrorDecode", () => {
    expect(fetchErrorDecode(notFoundError)).toEqual("Pas trouvé.");
    expect(fetchErrorDecode(validationError)).toEqual("{\"description\":[\"Ce champ est obligatoire.\"],\"method\":[\"Ce champ est obligatoire.\"]}");
  });

});

const notFoundError: QueryError = {
  status: 404,
  message: "Request failed with status code 404",
  data: {
    detail: "Pas trouvé."
  }
};

const validationError: QueryError = {
  message: "Request failed with status code 400",
  status: 400,
  data: {
    description: ["Ce champ est obligatoire."],
    method: ["Ce champ est obligatoire."]
  }
};

