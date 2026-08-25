import { expect, test } from "vitest";
import { Router } from "../src/app/router";

test("generates fragment URLs for static hosting", () => {
  expect(Router.paths()).toBe("#/");
  expect(Router.paths["sheet-renderer"]()).toBe("#/sheet-renderer");
  expect(Router.paths["horizontal-sheet"]()).toBe("#/horizontal-sheet");
  expect(Router.paths.midi()).toBe("#/midi");
});
