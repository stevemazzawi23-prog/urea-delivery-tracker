// Logo configuration for invoices
// Using URL reference instead of base64 for better performance
export const LOGO_URL = "https://private-us-east-1.manuscdn.com/sessionFile/dpGEUEdBQZclpI0GNU1Lij/sandbox/VnLnAhNCDW2g1XfJV8bmS8-img-1_1771347021000_na1fn_c3AtbG9naXN0aXgtbG9nbw.png?x-oss-process=image/resize,w_200,h_200/format,webp/quality,q_80";

// Alternative: Simple inline SVG logo for better compatibility
export const LOGO_SVG = `
<svg width="80" height="80" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="100" cy="100" r="95" fill="none" stroke="#1e3c72" stroke-width="2"/>
  
  <!-- Truck body -->
  <rect x="40" y="80" width="60" height="40" fill="#1e3c72" rx="4"/>
  
  <!-- Truck cabin -->
  <rect x="95" y="75" width="25" height="25" fill="#1e3c72" rx="2"/>
  
  <!-- Truck window -->
  <rect x="100" y="80" width="15" height="15" fill="#e8f4f8" rx="1"/>
  
  <!-- Wheels -->
  <circle cx="55" cy="125" r="8" fill="#1e3c72"/>
  <circle cx="85" cy="125" r="8" fill="#1e3c72"/>
  
  <!-- Fuel tank (gold) -->
  <ellipse cx="75" cy="60" rx="20" ry="25" fill="#f39c12"/>
  
  <!-- Motion lines -->
  <line x1="30" y1="90" x2="20" y2="90" stroke="#f39c12" stroke-width="2" stroke-linecap="round"/>
  <line x1="32" y1="100" x2="18" y2="100" stroke="#f39c12" stroke-width="2" stroke-linecap="round"/>
  <line x1="30" y1="110" x2="20" y2="110" stroke="#f39c12" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Company name -->
  <text x="100" y="155" font-size="16" font-weight="bold" fill="#1e3c72" text-anchor="middle" font-family="Arial, sans-serif">SP LOGISTIX</text>
</svg>
`;

export function getLogoSvg(): string {
  return LOGO_SVG;
}
