import { GoogleGenAI } from '@google/genai';
import { PDReportData, FamilyMember } from '../types';
import { blankReport } from '../sampleData';

const getEffectiveApiKey = (): string => {
  return (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    ''
  );
};

// Helper to convert File to Base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip Data-URI scheme prefix e.g. "data:application/pdf;base64,"
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Helper to parse key-value lines from plain text documents
function extractFallbackFromText(text: string): PDReportData {
  const result: PDReportData = { ...blankReport };
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      const val = match[2].trim();
      if (!val) continue;
      if (key.includes('customer name') || key === 'name' || key.includes('applicant')) result.customerName = val;
      else if (key.includes('shop') || key.includes('skop')) result.shopNo = val;
      else if (key.includes('visit date') || key === 'date') result.visitDate = val;
      else if (key.includes('location')) result.visitLocation = val;
      else if (key.includes('contact') || key.includes('phone') || key.includes('mobile')) result.contactNumbers = val;
      else if (key.includes('monthly income') || key.includes('income')) result.monthlyIncomeDetails = val;
      else if (key.includes('cibil')) result.cibilAppScore = val;
      else if (key.includes('market value')) result.marketValue = val;
      else if (key.includes('property address') || key.includes('address')) result.propertyAddress = val;
      else if (key.includes('recommendation')) {
        result.recommendation = val.toLowerCase().includes('not') ? 'Not Recommended' : 'Recommended';
      }
    }
  }
  return result;
}

// Clean and sanitize parsed data against blankReport structure
export function sanitizeReportData(raw: any): PDReportData {
  if (!raw || typeof raw !== 'object') {
    return { ...blankReport };
  }

  // Handle case where uploaded JSON is a SavedReportRecord wrapping reportData
  const source = raw.reportData && typeof raw.reportData === 'object' ? raw.reportData : raw;

  // Process family members ensuring array with 10 slots
  let familyMembers: FamilyMember[] = [];
  if (Array.isArray(source.familyMembers)) {
    familyMembers = source.familyMembers.map((m: any, idx: number) => ({
      id: `${idx + 1}`,
      name: String(m.name || ''),
      prefix: String(m.prefix || ''),
      guardianName: String(m.guardianName || ''),
      age: String(m.age || ''),
      relation: String(m.relation || ''),
      business: String(m.business || ''),
    }));
  }

  while (familyMembers.length < 10) {
    const idx = familyMembers.length;
    familyMembers.push({
      id: `${idx + 1}`,
      name: '',
      prefix: '',
      guardianName: '',
      age: '',
      relation: '',
      business: '',
    });
  }

  return {
    shopNo: String(source.shopNo || ''),
    visitDate: String(source.visitDate || new Date().toLocaleDateString('en-GB')),
    visitLocation: String(source.visitLocation || ''),
    customerName: String(source.customerName || ''),
    residenceType: String(source.residenceType || 'Self Owned'),
    residenceStabilityNotes: String(source.residenceStabilityNotes || ''),
    propertyAddress: String(source.propertyAddress || ''),
    permanentAddress: String(source.permanentAddress || 'Same as'),
    contactNumbers: String(source.contactNumbers || ''),
    distNearestBranch: String(source.distNearestBranch || ''),
    distSourcingBranch: String(source.distSourcingBranch || ''),
    locationType: String(source.locationType || 'Semi-Urban'),
    businessNameAddress: String(source.businessNameAddress || ''),
    businessVintage: String(source.businessVintage || ''),
    businessPremises: String(source.businessPremises || ''),
    monthlyIncomeDetails: String(source.monthlyIncomeDetails || ''),
    considerIncomeDetails: String(source.considerIncomeDetails || ''),
    neighbourRef1: String(source.neighbourRef1 || ''),
    neighbourRef2: String(source.neighbourRef2 || ''),
    businessRef1: String(source.businessRef1 || ''),
    businessRef2: String(source.businessRef2 || ''),
    familyMembers,
    masterTreeNotes: String(source.masterTreeNotes || ''),
    guarantorDetail: String(source.guarantorDetail || 'Guarantor Not Add at PD Visit Time'),
    cibilAppName: String(source.cibilAppName || source.customerName || ''),
    cibilAppScore: String(source.cibilAppScore || ''),
    cibilCoApp1Name: String(source.cibilCoApp1Name || ''),
    cibilCoApp1Score: String(source.cibilCoApp1Score || ''),
    cibilCoApp2Name: String(source.cibilCoApp2Name || ''),
    cibilCoApp2Score: String(source.cibilCoApp2Score || ''),
    cibilCoApp3Name: String(source.cibilCoApp3Name || ''),
    cibilCoApp3Score: String(source.cibilCoApp3Score || ''),
    existingLoans: String(source.existingLoans || ''),
    runningObligations: String(source.runningObligations || ''),
    assetVehicleDetails: String(source.assetVehicleDetails || ''),
    legalStatus: source.legalStatus === 'Imperfect' ? 'Imperfect' : 'Perfect',
    propertyTitle: String(source.propertyTitle || ''),
    propertyOwner: String(source.propertyOwner || ''),
    electricityDetails: String(source.electricityDetails || ''),
    marketValue: String(source.marketValue || ''),
    endUseLoan: String(source.endUseLoan || ''),
    monthlyEmiPaid: String(source.monthlyEmiPaid || ''),
    waiver: String(source.waiver || ''),
    requiredDocs: String(source.requiredDocs || ''),
    deviationFindings: String(source.deviationFindings || ''),
    remarksNotes: String(source.remarksNotes || ''),
    mitigateNotes: String(source.mitigateNotes || ''),
    recommendation: source.recommendation === 'Not Recommended' ? 'Not Recommended' : 'Recommended',
    dirNorth: String(source.dirNorth || 'Same as document'),
    dirSouth: String(source.dirSouth || 'Same as document'),
    dirEast: String(source.dirEast || 'Same as document'),
    dirWest: String(source.dirWest || 'Same as document'),
    propertySize: String(source.propertySize || 'SAME AS PATTA'),
    pdAuthorisedPerson: String(source.pdAuthorisedPerson || ''),
    signatureDataUrl: source.signatureDataUrl ? String(source.signatureDataUrl) : '',
    signDate: String(source.signDate || new Date().toLocaleDateString('en-GB')),
  };
}

export async function parseUploadedReport(
  file: File,
  onProgress?: (status: string) => void
): Promise<PDReportData> {
  const fileName = file.name.toLowerCase();

  // 1. If JSON file, parse directly
  if (fileName.endsWith('.json')) {
    onProgress?.('Reading JSON file content...');
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      onProgress?.('✓ Successfully parsed JSON document');
      return sanitizeReportData(parsed);
    } catch (err: any) {
      throw new Error(`Invalid JSON format: ${err?.message || err}`);
    }
  }

  // 2. If PDF, Text, or Document: Use Gemini Multimodal Extraction
  onProgress?.('Preparing document for AI extraction...');
  const activeKey = getEffectiveApiKey();
  const isPdf = fileName.endsWith('.pdf') || file.type === 'application/pdf';
  
  if (!activeKey) {
    if (!isPdf) {
      onProgress?.('Extracting document fields from text...');
      const text = await file.text();
      return extractFallbackFromText(text);
    }
    throw new Error(
      'Gemini API key is not configured. Please ensure GEMINI_API_KEY is available in environment.'
    );
  }

  const ai = new GoogleGenAI({
    apiKey: activeKey,
  });

  let base64Data = '';
  let fileTextContent = '';
  if (isPdf) {
    onProgress?.('Encoding document bytes...');
    base64Data = await fileToBase64(file);
  } else {
    onProgress?.('Reading document text...');
    fileTextContent = await file.text();
  }

  const systemInstruction = `You are an expert Document Information Extraction Assistant for SK Finance Limited Personal Discussion (PD) Visit Reports.
Extract all available borrower, business, family, credit, and property inspection details from the provided document.
Output MUST be a valid JSON object matching the following fields:
- shopNo: string (SKOP No / Shop No)
- visitDate: string (DD/MM/YYYY)
- visitLocation: string
- customerName: string (Primary applicant full name)
- residenceType: string (e.g. 'Self Owned', 'Rented', 'Company Provided')
- residenceStabilityNotes: string (e.g. 'Living since birth')
- propertyAddress: string
- permanentAddress: string
- contactNumbers: string
- distNearestBranch: string
- distSourcingBranch: string
- locationType: string ('Urban', 'Semi-Urban', or 'Rural')
- businessNameAddress: string
- businessVintage: string
- businessPremises: string
- monthlyIncomeDetails: string
- considerIncomeDetails: string
- neighbourRef1: string
- neighbourRef2: string
- businessRef1: string
- businessRef2: string
- familyMembers: array of objects with keys: id, name, prefix ('s/o', 'w/o', 'd/o', 'c/o', or ''), guardianName, age, relation, business
- masterTreeNotes: string
- guarantorDetail: string
- cibilAppName: string
- cibilAppScore: string
- cibilCoApp1Name: string
- cibilCoApp1Score: string
- cibilCoApp2Name: string
- cibilCoApp2Score: string
- cibilCoApp3Name: string
- cibilCoApp3Score: string
- existingLoans: string
- runningObligations: string
- assetVehicleDetails: string
- legalStatus: string
- propertyTitle: string
- propertyOwner: string
- electricityDetails: string
- marketValue: string
- endUseLoan: string
- monthlyEmiPaid: string
- waiver: string
- requiredDocs: string
- deviationFindings: string
- remarksNotes: string
- mitigateNotes: string
- recommendation: string ('Recommended' or 'Not Recommended')
- dirNorth: string
- dirSouth: string
- dirEast: string
- dirWest: string
- propertySize: string
- pdAuthorisedPerson: string
- signDate: string

Accurately transcribe all names, Hindi/English relations, amounts, and dates. If a field is not found in the document, use an empty string or omit it. Return ONLY the raw JSON object.`;

  onProgress?.('Extracting report data with Gemini 3.8 Flash...');

  const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let jsonString = '';
  let lastError: any = null;

  const requestContents = isPdf
    ? [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data,
          },
        },
        {
          text: 'Extract and parse all field data from this SK Finance PD Visit Report document into the requested JSON schema format.',
        },
      ]
    : [
        {
          text: `DOCUMENT CONTENT:\n${fileTextContent}`,
        },
        {
          text: 'Extract and parse all field data from this SK Finance PD Visit Report document into the requested JSON schema format.',
        },
      ];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: requestContents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      jsonString = response.text?.trim() || '';
      if (jsonString) break;
    } catch (err: any) {
      lastError = err;
      console.warn(`Extraction attempt with model ${model} failed:`, err?.message || err);
    }
  }

  if (!jsonString) {
    throw new Error(
      lastError?.message ||
        'Failed to extract document contents. Please check your document and network connection.'
    );
  }

  onProgress?.('Validating extracted fields...');

  try {
    // Strip markdown code fence if model accidentally wrapped it
    const cleanJson = jsonString
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    const parsed = JSON.parse(cleanJson);
    onProgress?.('✓ Document extracted successfully!');
    return sanitizeReportData(parsed);
  } catch (err: any) {
    console.error('Failed to parse Gemini output as JSON:', jsonString);
    throw new Error(`Failed to parse extracted AI output: ${err?.message || err}`);
  }
}
