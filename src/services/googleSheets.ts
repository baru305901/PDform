import { PDReportData } from '../types';
import { OfficerSession } from '../components/BranchOfficerModal';

export const GOOGLE_SHEETS_WEBHOOK_URL_KEY = 'sk_finance_google_sheets_webhook_url';
export const GOOGLE_SHEETS_AUTOSYNC_KEY = 'sk_finance_google_sheets_autosync';
export const GOOGLE_SHEETS_LAST_SYNC_KEY = 'sk_finance_google_sheets_last_sync';

export interface LastSyncInfo {
  timestamp: string;
  customerName: string;
  skopNumber: string;
  status: 'success' | 'error';
  errorMessage?: string;
}

export function getGoogleSheetsWebhookUrl(): string {
  try {
    return localStorage.getItem(GOOGLE_SHEETS_WEBHOOK_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function setGoogleSheetsWebhookUrl(url: string): void {
  try {
    const cleanUrl = url.trim();
    if (cleanUrl) {
      localStorage.setItem(GOOGLE_SHEETS_WEBHOOK_URL_KEY, cleanUrl);
    } else {
      localStorage.removeItem(GOOGLE_SHEETS_WEBHOOK_URL_KEY);
    }
  } catch (e) {
    console.error('Error saving Google Sheets webhook URL:', e);
  }
}

export function getGoogleSheetsAutoSync(): boolean {
  try {
    const val = localStorage.getItem(GOOGLE_SHEETS_AUTOSYNC_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export function setGoogleSheetsAutoSync(enabled: boolean): void {
  try {
    localStorage.setItem(GOOGLE_SHEETS_AUTOSYNC_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Error saving Google Sheets auto-sync preference:', e);
  }
}

export function getLastSyncInfo(): LastSyncInfo | null {
  try {
    const raw = localStorage.getItem(GOOGLE_SHEETS_LAST_SYNC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLastSyncInfo(info: LastSyncInfo): void {
  try {
    localStorage.setItem(GOOGLE_SHEETS_LAST_SYNC_KEY, JSON.stringify(info));
  } catch (e) {
    console.error('Error saving last sync info:', e);
  }
}

/**
 * Formats the PD report data into a clean, flat key-value structure
 * ideal for appending rows to a Google Spreadsheet.
 */
export function formatReportPayloadForGoogleSheets(
  reportData: PDReportData,
  session?: OfficerSession | null,
  reportId?: string | null
) {
  const branchName =
    reportData.branchName || reportData.branch_name || session?.branchName || 'Beawar';
  const officerName = (
    reportData.officerName ||
    reportData.officer_name ||
    session?.officerName ||
    reportData.pdAuthorisedPerson ||
    'Credit Officer'
  ).replace(/Kuamar/gi, 'Kumar');

  const familySummary = reportData.familyMembers
    ?.filter((m) => m.name && m.name.trim())
    ?.map((m) => `${m.name} (${m.relation || 'Member'}, age ${m.age || 'N/A'}${m.business ? `, ${m.business}` : ''})`)
    ?.join('; ') || 'None listed';

  return {
    timestamp: new Date().toISOString(),
    syncDate: new Date().toLocaleDateString('en-GB'),
    reportId: reportId || '',
    shopNo: reportData.shopNo || '',
    skopNumber: reportData.shopNo || '',
    customerName: reportData.customerName || '',
    branchName,
    officerName,
    visitDate: reportData.visitDate || '',
    visitLocation: reportData.visitLocation || '',
    contactNumbers: reportData.contactNumbers || '',
    residenceType: reportData.residenceType || '',
    residenceStabilityNotes: reportData.residenceStabilityNotes || '',
    propertyAddress: reportData.propertyAddress || '',
    permanentAddress: reportData.permanentAddress || '',
    distNearestBranch: reportData.distNearestBranch || '',
    distSourcingBranch: reportData.distSourcingBranch || '',
    locationType: reportData.locationType || '',
    businessNameAddress: reportData.businessNameAddress || '',
    businessVintage: reportData.businessVintage || '',
    businessPremises: reportData.businessPremises || '',
    monthlyIncomeDetails: reportData.monthlyIncomeDetails || '',
    considerIncomeDetails: reportData.considerIncomeDetails || '',
    neighbourRef1: reportData.neighbourRef1 || '',
    neighbourRef2: reportData.neighbourRef2 || '',
    businessRef1: reportData.businessRef1 || '',
    businessRef2: reportData.businessRef2 || '',
    familyCount: reportData.familyMembers?.filter((m) => m.name && m.name.trim()).length || 0,
    familySummary,
    masterTreeNotes: reportData.masterTreeNotes || '',
    guarantorDetail: reportData.guarantorDetail || '',
    cibilAppName: reportData.cibilAppName || '',
    cibilAppScore: reportData.cibilAppScore || '',
    cibilCoApp1Name: reportData.cibilCoApp1Name || '',
    cibilCoApp1Score: reportData.cibilCoApp1Score || '',
    cibilCoApp2Name: reportData.cibilCoApp2Name || '',
    cibilCoApp2Score: reportData.cibilCoApp2Score || '',
    cibilCoApp3Name: reportData.cibilCoApp3Name || '',
    cibilCoApp3Score: reportData.cibilCoApp3Score || '',
    existingLoans: reportData.existingLoans || '',
    runningObligations: reportData.runningObligations || '',
    assetVehicleDetails: reportData.assetVehicleDetails || '',
    legalStatus: reportData.legalStatus || 'Perfect',
    propertyTitle: reportData.propertyTitle || '',
    propertyOwner: reportData.propertyOwner || '',
    propertySize: reportData.propertySize || '',
    electricityDetails: reportData.electricityDetails || '',
    marketValue: reportData.marketValue || '',
    endUseLoan: reportData.endUseLoan || '',
    monthlyEmiPaid: reportData.monthlyEmiPaid || '',
    waiver: reportData.waiver || '',
    requiredDocs: reportData.requiredDocs || '',
    deviationFindings: reportData.deviationFindings || '',
    remarksNotes: reportData.remarksNotes || '',
    mitigateNotes: reportData.mitigateNotes || '',
    recommendation: reportData.recommendation || 'Recommended',
    dirNorth: reportData.dirNorth || '',
    dirSouth: reportData.dirSouth || '',
    dirEast: reportData.dirEast || '',
    dirWest: reportData.dirWest || '',
    pdAuthorisedPerson: officerName,
    rawReport: reportData
  };
}

/**
 * Sends report payload to Google Apps Script Webhook.
 * Handles Google Apps Script 302 redirects and CORS safely.
 */
export async function syncReportToGoogleSheets(
  reportData: PDReportData,
  customWebhookUrl?: string,
  session?: OfficerSession | null,
  reportId?: string | null
): Promise<{ success: boolean; message: string; responseData?: any }> {
  const webhookUrl = (customWebhookUrl || getGoogleSheetsWebhookUrl()).trim();

  if (!webhookUrl) {
    const errorMsg = 'Google Apps Script Web App URL is not configured. Please paste your URL in Settings.';
    setLastSyncInfo({
      timestamp: new Date().toISOString(),
      customerName: reportData.customerName || 'Unnamed',
      skopNumber: reportData.shopNo || '',
      status: 'error',
      errorMessage: errorMsg
    });
    throw new Error(errorMsg);
  }

  // Validate URL basic format
  try {
    const parsed = new URL(webhookUrl);
    if (!parsed.protocol.startsWith('http')) {
      throw new Error('URL must start with http:// or https://');
    }
  } catch (e: any) {
    const errorMsg = `Invalid Google Webhook URL: ${e?.message || 'Invalid URL'}`;
    setLastSyncInfo({
      timestamp: new Date().toISOString(),
      customerName: reportData.customerName || 'Unnamed',
      skopNumber: reportData.shopNo || '',
      status: 'error',
      errorMessage: errorMsg
    });
    throw new Error(errorMsg);
  }

  const payload = formatReportPayloadForGoogleSheets(reportData, session, reportId);
  const payloadJson = JSON.stringify(payload);

  try {
    // Note: Google Apps Script Web App standard practice is posting as 'text/plain;charset=utf-8'
    // to bypass CORS preflight options check, or redirect 302.
    // We try direct fetch first.
    let response: Response;
    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: payloadJson,
        redirect: 'follow'
      });
    } catch (directErr) {
      // If direct fetch triggers a CORS redirect restriction, retry with no-cors fallback
      // which sends the POST payload successfully to Google Apps Script.
      console.warn('Direct fetch error, retrying with no-cors mode:', directErr);
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: payloadJson
      });

      setLastSyncInfo({
        timestamp: new Date().toISOString(),
        customerName: reportData.customerName || 'Unnamed',
        skopNumber: reportData.shopNo || '',
        status: 'success'
      });

      return {
        success: true,
        message: `Report successfully dispatched to Google Sheet (SKOP: ${reportData.shopNo || 'N/A'})`
      };
    }

    let parsedResponse: any = null;
    try {
      const text = await response.text();
      try {
        parsedResponse = JSON.parse(text);
      } catch {
        parsedResponse = { text };
      }
    } catch {
      // ignore parsing if already consumed
    }

    if (response.ok || response.status === 200 || response.type === 'opaque') {
      setLastSyncInfo({
        timestamp: new Date().toISOString(),
        customerName: reportData.customerName || 'Unnamed',
        skopNumber: reportData.shopNo || '',
        status: 'success'
      });

      return {
        success: true,
        message: `Report successfully synced to Google Sheet for "${reportData.customerName || 'Customer'}" (SKOP: ${reportData.shopNo || 'N/A'})`,
        responseData: parsedResponse
      };
    } else {
      const errMsg = parsedResponse?.error || parsedResponse?.message || `HTTP ${response.status}: ${response.statusText}`;
      setLastSyncInfo({
        timestamp: new Date().toISOString(),
        customerName: reportData.customerName || 'Unnamed',
        skopNumber: reportData.shopNo || '',
        status: 'error',
        errorMessage: errMsg
      });
      throw new Error(`Google Sheets responded with error: ${errMsg}`);
    }
  } catch (err: any) {
    const errorMsg = err?.message || 'Unknown network error syncing to Google Sheet';
    setLastSyncInfo({
      timestamp: new Date().toISOString(),
      customerName: reportData.customerName || 'Unnamed',
      skopNumber: reportData.shopNo || '',
      status: 'error',
      errorMessage: errorMsg
    });
    throw new Error(errorMsg);
  }
}

/**
 * Clean Google Apps Script sample code to copy into Google Sheets Extensions > Apps Script.
 */
export const SAMPLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script for SK Finance PD Visit Reports
 * 
 * SETUP INSTRUCTIONS:
 * 1. In your Google Sheet, click "Extensions" > "Apps Script".
 * 2. Delete any code in Code.gs and paste this entire code snippet.
 * 3. Click "Save" (Floppy disk icon).
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type: "Web app".
 * 6. Set Description: "SK Finance PD Sync".
 * 7. Set "Execute as": "Me (your email)".
 * 8. Set "Who has access": "Anyone" (CRITICAL so the browser app can POST to it).
 * 9. Click "Deploy", authorize permissions when prompted, and copy the "Web app URL" (ends in /exec).
 * 10. Paste the Web app URL in the SK Finance app Settings!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("PD_Reports") || ss.getActiveSheet();
    
    // Auto-create Header Row if sheet is empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Sync Timestamp",
        "SKOP Number",
        "Customer Name",
        "Branch Name",
        "Credit Officer",
        "Visit Date",
        "Visit Location",
        "Contact Numbers",
        "Residence Type",
        "Property Address",
        "Permanent Address",
        "Business Name & Address",
        "Business Vintage",
        "Business Premises",
        "Monthly Income Details",
        "Considered Income Details",
        "Family Count",
        "Family Summary",
        "CIBIL App Name",
        "CIBIL App Score",
        "CIBIL Co-App 1",
        "CIBIL Co-App 1 Score",
        "Existing Loans",
        "Running Obligations",
        "Asset / Vehicles",
        "Legal Status",
        "Property Title",
        "Market Value",
        "Monthly EMI Paid",
        "Recommendation",
        "Remarks & Notes",
        "Report ID"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
      sheet.setFrozenRows(1);
    }
    
    // Append the report row
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.skopNumber || data.shopNo || "",
      data.customerName || "",
      data.branchName || "",
      data.officerName || "",
      data.visitDate || "",
      data.visitLocation || "",
      data.contactNumbers || "",
      data.residenceType || "",
      data.propertyAddress || "",
      data.permanentAddress || "",
      data.businessNameAddress || "",
      data.businessVintage || "",
      data.businessPremises || "",
      data.monthlyIncomeDetails || "",
      data.considerIncomeDetails || "",
      data.familyCount || 0,
      data.familySummary || "",
      data.cibilAppName || "",
      data.cibilAppScore || "",
      data.cibilCoApp1Name || "",
      data.cibilCoApp1Score || "",
      data.existingLoans || "",
      data.runningObligations || "",
      data.assetVehicleDetails || "",
      data.legalStatus || "",
      data.propertyTitle || "",
      data.marketValue || "",
      data.monthlyEmiPaid || "",
      data.recommendation || "",
      data.remarksNotes || "",
      data.reportId || ""
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", customerName: data.customerName, skopNumber: data.skopNumber }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "active", message: "SK Finance Google Apps Script Webhook is live!" }))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
