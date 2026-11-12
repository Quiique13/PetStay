import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderLegalPages } from "../server/legal-pages.ts";
import type { LegalOperator } from "../server/legal-pages.ts";

test("legal notices remain drafts with incomplete identity, even if marked published", () => {
  const operator = JSON.parse(readFileSync(new URL("../legal/operator.json", import.meta.url), "utf8")) as LegalOperator;
  const pages = renderLegalPages({ ...operator, status: "published", name: "<script>alert(1)</script>", privacyEmail: "" });
  assert.equal(Object.keys(pages).length, 6);
  for (const [path, html] of Object.entries(pages)) {
    if (!path.endsWith(".html")) continue;
    assert.match(html, /Rascunho/);
    assert.match(html, /name="robots" content="noindex"/);
    assert.doesNotMatch(html, /<script/i);
    assert.match(html, /href="privacy.html"/);
    assert.match(html, /href="terms.html"/);
  }
  assert.match(pages["legal/privacy.html"], /&lt;script&gt;/);
});
