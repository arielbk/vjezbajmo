import { describe, it, expect } from "vitest";
import { generateCacheKey } from "../cache-provider";

// Let's focus on testing the core utilities that don't depend on SSR/localStorage
describe("Cache Provider Utils", () => {
  describe("generateCacheKey", () => {
    it("should generate correct cache key without theme", () => {
      const key = generateCacheKey("verbTenses", "A2.2");
      expect(key).toBe("verbTenses:A2.2:default");
    });

    it("should generate correct cache key with theme", () => {
      const key = generateCacheKey("verbAspect", "B1.1", "sports");
      expect(key).toBe("verbAspect:B1.1:sports");
    });

    it("should handle all exercise types", () => {
      const types = ["verbTenses", "nounDeclension", "verbAspect", "relativePronouns"] as const;

      types.forEach((type) => {
        const key = generateCacheKey(type, "A2.2");
        expect(key).toBe(`${type}:A2.2:default`);
      });
    });

    it("should handle all CEFR levels", () => {
      const levels = ["A1", "A2.1", "A2.2", "B1.1"] as const;

      levels.forEach((level) => {
        const key = generateCacheKey("verbTenses", level);
        expect(key).toBe(`verbTenses:${level}:default`);
      });
    });
  });
});
