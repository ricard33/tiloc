import { stringAvatar } from "./avatarUtils";

describe("avatarUtils", function() {
  it("stringAvatar", () => {
    // expect(stringAvatar({full_name: "John DOE", email: ""})).toEqual({});
    expect(stringAvatar({full_name: "John DOE", email: ""})).toHaveProperty("src");
    expect(stringAvatar({full_name: "John", email: ""})).toHaveProperty("src");
    expect(stringAvatar({full_name: "", email: ""})).toHaveProperty("src");
  });

});
