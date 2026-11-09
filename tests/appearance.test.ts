import test from "node:test";
import assert from "node:assert/strict";
import { defaultAppearance, interfaceThemes, parseAppearance } from "../src/utils/appearance.ts";
import { messages } from "../src/i18n/messages.ts";

test("all nine interface themes persist in every display mode, including existing preferences", () => {
  assert.equal(interfaceThemes.length, 9);
  assert.equal(new Set(interfaceThemes.map(theme => theme.value)).size, 9);
  for (const theme of interfaceThemes) {
    assert.ok(Object.hasOwn(messages, theme.label), theme.label);
    assert.ok(Object.hasOwn(messages, theme.description), theme.description);
    for (const mode of ["light", "dark", "system"] as const) {
      const saved = { mode, colorScheme: theme.value, contrast: "high", textSize: "largest" };
      assert.deepEqual(parseAppearance(JSON.parse(JSON.stringify(saved))), saved);
    }
  }
  assert.deepEqual(parseAppearance({ mode: "dark", colorScheme: "ocean" }), { ...defaultAppearance, mode: "dark", colorScheme: "ocean" });
});

test("invalid saved appearance fields fall back independently", () => {
  for (const value of [null, undefined, "invalid", [], { mode: "sepia", colorScheme: "missing", contrast: "unsafe", textSize: -1 }]) {
    assert.deepEqual(parseAppearance(value), defaultAppearance);
  }
  assert.deepEqual(parseAppearance({ mode: "dark", colorScheme: "missing", contrast: "enhanced" }), { ...defaultAppearance, mode: "dark", contrast: "enhanced" });
});
