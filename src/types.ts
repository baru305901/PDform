export interface FamilyMember {
  id: string;
  name: string;
  age: string;
  relation: string;
  business: string;
}

export interface PDReportData {
  // Page 1: Header & Shop
  shopNo: string;
  visitDate: string;
  visitLocation: string;

  // Borrower & Residence Details
  customerName: string;
  residenceType: string;
  propertyAddress: string;
  permanentAddress: string;
  contactNumbers: string;
  distNearestBranch: string;
  distSourcingBranch: string;
  locationType: string;
  businessNameAddress: string;
  businessVintage: string;
  businessPremises: string;

  // Monthly Income & Observations
  monthlyIncomeDetails: string;
  considerIncomeDetails: string;

  // References
  neighbourRef1: string;
  neighbourRef2: string;
  businessRef1: string;
  businessRef2: string;

  // Page 2: Family Tree
  familyMembers: FamilyMember[];
  masterTreeNotes: string;
  guarantorDetail: string;

  // Page 3: CIBIL Scores
  cibilAppName: string;
  cibilAppScore: string;
  cibilCoApp1Name: string;
  cibilCoApp1Score: string;
  cibilCoApp2Name: string;
  cibilCoApp2Score: string;
  cibilCoApp3Name: string;
  cibilCoApp3Score: string;

  // Loan, Asset, Property Details
  existingLoans: string;
  runningObligations: string;
  assetVehicleDetails: string;
  legalStatus: 'Perfect' | 'Imperfect';
  propertyTitle: string;
  propertyOwner: string;
  electricityDetails: string;
  marketValue: string;
  endUseLoan: string;
  monthlyEmiPaid: string;
  waiver: string;
  requiredDocs: string;

  // Deviation & Recommendations
  deviationFindings: string;
  remarksNotes: string;
  mitigateNotes: string;
  recommendation: 'Recommended' | 'Not Recommended';

  // Property Directions & Size
  dirNorth: string;
  dirSouth: string;
  dirEast: string;
  dirWest: string;
  propertySize: string;

  // Footer & PD Authority
  pdAuthorisedPerson: string;
  signatureDataUrl?: string;
  signDate?: string;
}
