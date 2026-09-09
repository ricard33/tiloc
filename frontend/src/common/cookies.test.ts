import { getCookie } from "./cookies";

describe("getCookie()", () => {
  afterEach(() => {
    // wipe cookies set during a test
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  });

  it("returns null when the cookie is absent", () => {
    expect(getCookie("missing")).toBeNull();
  });

  it("returns the value of an existing cookie", () => {
    document.cookie = "csrftoken=abc123";
    expect(getCookie("csrftoken")).toEqual("abc123");
  });

  it("url-decodes the value", () => {
    document.cookie = "greeting=" + encodeURIComponent("hello world & co");
    expect(getCookie("greeting")).toEqual("hello world & co");
  });

  it("does not match a cookie whose name is only a prefix", () => {
    document.cookie = "session_id=42";
    expect(getCookie("session")).toBeNull();
  });
});
