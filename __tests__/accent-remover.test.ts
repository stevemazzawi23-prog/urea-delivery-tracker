import { describe, it, expect } from "vitest";
import { removeAccents } from "../lib/accent-remover";

/**
 * Test suite for French accent removal utility
 * 
 * This test validates that:
 * 1. All French accented characters are properly removed
 * 2. Non-accented characters remain unchanged
 * 3. Empty strings are handled correctly
 * 4. Mixed content is processed correctly
 */

describe("Accent Remover", () => {
  it("should remove lowercase accents", () => {
    expect(removeAccents("café")).toBe("cafe");
    expect(removeAccents("élève")).toBe("eleve");
    expect(removeAccents("château")).toBe("chateau");
    expect(removeAccents("où")).toBe("ou");
    expect(removeAccents("çà")).toBe("ca");
  });

  it("should remove uppercase accents", () => {
    expect(removeAccents("CAFÉ")).toBe("CAFE");
    expect(removeAccents("ÉLÈVE")).toBe("ELEVE");
    expect(removeAccents("CHÂTEAU")).toBe("CHATEAU");
    expect(removeAccents("OÙ")).toBe("OU");
    expect(removeAccents("ÇA")).toBe("CA");
  });

  it("should handle mixed case accents", () => {
    expect(removeAccents("Café")).toBe("Cafe");
    expect(removeAccents("Élève")).toBe("Eleve");
    expect(removeAccents("Château")).toBe("Chateau");
  });

  it("should preserve non-accented characters", () => {
    expect(removeAccents("hello")).toBe("hello");
    expect(removeAccents("WORLD")).toBe("WORLD");
    expect(removeAccents("123")).toBe("123");
    expect(removeAccents("!@#$%")).toBe("!@#$%");
  });

  it("should handle empty strings", () => {
    expect(removeAccents("")).toBe("");
  });



  it("should handle invoice text with accents", () => {
    const invoiceText = "Facturation à: Société Générale, Détails de la livraison, Quantité livrée";
    const expected = "Facturation a: Societe Generale, Details de la livraison, Quantite livree";
    expect(removeAccents(invoiceText)).toBe(expected);
  });

  it("should handle common French words", () => {
    expect(removeAccents("Numéro")).toBe("Numero");
    expect(removeAccents("Frais")).toBe("Frais");
    expect(removeAccents("Livraison")).toBe("Livraison");
    expect(removeAccents("Merci")).toBe("Merci");
    expect(removeAccents("Urée")).toBe("Uree");
  });

  it("should handle French accented vowels", () => {
    expect(removeAccents("à")).toBe("a");
    expect(removeAccents("é")).toBe("e");
    expect(removeAccents("è")).toBe("e");
    expect(removeAccents("ê")).toBe("e");
    expect(removeAccents("ë")).toBe("e");
    expect(removeAccents("î")).toBe("i");
    expect(removeAccents("ï")).toBe("i");
    expect(removeAccents("ô")).toBe("o");
    expect(removeAccents("ö")).toBe("o");
    expect(removeAccents("ù")).toBe("u");
    expect(removeAccents("û")).toBe("u");
    expect(removeAccents("ü")).toBe("u");
    expect(removeAccents("ç")).toBe("c");
  });

  it("should handle complete invoice header", () => {
    const header = "FACTURATION À: Société Générale d'Énergie";
    const expected = "FACTURATION A: Societe Generale d'Energie";
    expect(removeAccents(header)).toBe(expected);
  });

  it("should preserve special characters and numbers", () => {
    const text = "Facture #2026-001 - 150,50$ - 25% rabais";
    const expected = "Facture #2026-001 - 150,50$ - 25% rabais";
    expect(removeAccents(text)).toBe(expected);
  });
});
