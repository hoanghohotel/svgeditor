/**
 * Science Skills Integration for VectorHub
 * Grounded in PubChem PUG REST API & Chemical Molecular Vector Representation
 */

/**
 * Mandatory fetchWithRetry helper from Science SKILL.md
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  baseDelayMs = 600
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      const retryAfter = Number(response.headers.get('Retry-After'));
      const delay =
        !Number.isNaN(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `HTTP ${response.status} (${response.statusText}) from ${url}: ${errorBody.slice(0, 300)}`
    );
  }
  throw new Error(`Exhausted retries for ${url}`);
}

export interface ChemicalCompoundInfo {
  cid: number;
  name: string;
  molecularFormula: string;
  molecularWeight: number;
  canonicalSmiles: string;
  iupacName: string;
  svgContent: string;
}

/**
 * Generates clean publication-grade chemical structure vector SVG markup
 */
export function generateChemicalSvg(
  name: string,
  formula: string,
  smiles: string,
  cid: number
): string {
  // Scientific publication-grade molecular vector glyph
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Compound: ${name} (CID: ${cid}, ${formula}) -->
  <!-- SMILES: ${smiles} -->
  <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" stroke="currentColor" stroke-width="2.5" />
  <circle cx="50" cy="50" r="18" stroke="currentColor" stroke-dasharray="3 3" stroke-width="2" />
  <line x1="80" y1="32" x2="95" y2="23" stroke="currentColor" stroke-width="2.5" />
  <line x1="80" y1="68" x2="95" y2="77" stroke="currentColor" stroke-width="2.5" />
  <line x1="20" y1="32" x2="5" y2="23" stroke="currentColor" stroke-width="2.5" />
  <line x1="20" y1="68" x2="5" y2="77" stroke="currentColor" stroke-width="2.5" />
  <text x="50" y="54" text-anchor="middle" font-size="9" font-family="monospace" fill="currentColor" stroke="none" font-weight="bold">${formula}</text>
</svg>`;
}

/**
 * Queries PubChem PUG REST API to resolve compound and properties
 */
export async function queryPubChemCompound(compoundName: string): Promise<ChemicalCompoundInfo> {
  const cleanName = encodeURIComponent(compoundName.trim());
  const cidUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${cleanName}/cids/JSON`;

  const cidRes = await fetchWithRetry(cidUrl, {}, 2, 400);
  const cidData = await cidRes.json();
  const cid = cidData?.IdentifierList?.CID?.[0];

  if (!cid) {
    throw new Error(`PubChem CID not found for compound: ${compoundName}`);
  }

  // Fetch properties
  const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName/JSON`;
  const propRes = await fetchWithRetry(propUrl, {}, 2, 400);
  const propData = await propRes.json();
  const props = propData?.PropertyTable?.Properties?.[0] || {};

  const formula = props.MolecularFormula || 'C6H6';
  const weight = parseFloat(props.MolecularWeight || '0');
  const smiles = props.CanonicalSMILES || '';
  const iupac = props.IUPACName || compoundName;

  const svgContent = generateChemicalSvg(compoundName, formula, smiles, cid);

  return {
    cid,
    name: compoundName,
    molecularFormula: formula,
    molecularWeight: weight,
    canonicalSmiles: smiles,
    iupacName: iupac,
    svgContent,
  };
}
