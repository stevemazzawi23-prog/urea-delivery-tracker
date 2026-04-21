import { describe, it, expect } from "vitest";
import { removeAccents } from "../lib/accent-remover";

/**
 * Test suite for delivery ticket accent removal
 * 
 * This test validates that:
 * 1. Delivery report text is properly cleaned of accents
 * 2. All French labels are converted to non-accented versions
 * 3. Client and site names are properly cleaned
 */

describe("Delivery Ticket Accent Removal", () => {
  it("should remove accents from delivery report header", () => {
    const header = "RAPPORT DE LIVRAISON D'URÉE";
    const expected = "RAPPORT DE LIVRAISON D'UREE";
    expect(removeAccents(header)).toBe(expected);
  });

  it("should remove accents from client name", () => {
    expect(removeAccents("Société Générale")).toBe("Societe Generale");
    expect(removeAccents("Énergie Québec")).toBe("Energie Quebec");
    expect(removeAccents("Café Français")).toBe("Cafe Francais");
  });

  it("should remove accents from site name", () => {
    expect(removeAccents("Entrepôt Montréal")).toBe("Entrepot Montreal");
    expect(removeAccents("Usine Côté-Nord")).toBe("Usine Cote-Nord");
  });

  it("should remove accents from delivery labels", () => {
    expect(removeAccents("DURÉE")).toBe("DUREE");
    expect(removeAccents("DÉTAIL DES UNITÉS")).toBe("DETAIL DES UNITES");
    expect(removeAccents("TOTAL LIVRÉ")).toBe("TOTAL LIVRE");
    expect(removeAccents("Rapport généré")).toBe("Rapport genere");
  });

  it("should remove accents from unit names", () => {
    expect(removeAccents("Réservoir")).toBe("Reservoir");
    expect(removeAccents("Citerne à urée")).toBe("Citerne a uree");
    expect(removeAccents("Équipement")).toBe("Equipement");
  });

  it("should handle complete delivery report text", () => {
    const reportText = `
RAPPORT DE LIVRAISON D'URÉE
CLIENT: Société Générale
ENTREPRISE: Énergie Québec
SITE: Entrepôt Montréal
LIVREUR: Jean-François Côté

DÉTAIL DES UNITÉS:
  • Réservoir A: 500 L
  • Citerne B: 300 L

TOTAL LIVRÉ: 800 litres
Rapport généré le 2026-02-17
    `.trim();

    const result = removeAccents(reportText);
    
    // Verify no accents remain
    expect(result).not.toContain("é");
    expect(result).not.toContain("è");
    expect(result).not.toContain("ê");
    expect(result).not.toContain("à");
    expect(result).not.toContain("ô");
    
    // Verify key conversions
    expect(result).toContain("RAPPORT DE LIVRAISON D'UREE");
    expect(result).toContain("Societe Generale");
    expect(result).toContain("Energie Quebec");
    expect(result).toContain("Entrepot Montreal");
    expect(result).toContain("DETAIL DES UNITES");
    expect(result).toContain("TOTAL LIVRE");
  });

  it("should preserve numbers and special characters in delivery report", () => {
    const text = "Livraison #2026-001 - 150,50$ - 25% rabais";
    const expected = "Livraison #2026-001 - 150,50$ - 25% rabais";
    expect(removeAccents(text)).toBe(expected);
  });

  it("should handle driver names with accents", () => {
    expect(removeAccents("François Deschênes")).toBe("Francois Deschenes");
    expect(removeAccents("Éric Côté-Gagnon")).toBe("Eric Cote-Gagnon");
    expect(removeAccents("Jérôme Léveillé")).toBe("Jerome Leveille");
  });

  it("should handle empty driver name", () => {
    const text = "Non specifie";
    expect(removeAccents(text)).toBe("Non specifie");
  });
});
