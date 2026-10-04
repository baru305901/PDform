import * as XLSX from 'xlsx';
import { PDReportData } from '../types';

export function exportToExcel(data: PDReportData) {
  try {
    const custName = data.customerName.trim() || 'Customer';
    const shopNo = data.shopNo.trim() || 'NA';

    // Sheet 1: General & PD Summary
    const generalData: (string | number)[][] = [
      ['SK FINANCE LIMITED - PD VISIT REPORT (RESIDENCE / BUSINESS)'],
      ['SHOP NO', data.shopNo],
      ['DATE OF VISIT', data.visitDate],
      ['VISIT LOCATION', data.visitLocation],
      ['CUSTOMER NAME', custName],
      ['STABILITY & RESIDENCE TYPE', data.residenceType],
      ['PROPERTY ADDRESS', data.propertyAddress],
      ['PERMANENT / CURRENT ADDRESS', data.permanentAddress],
      ['CONTACT NUMBERS (VERIFIED)', data.contactNumbers],
      ['DISTANCE FROM NEAREST BRANCH', data.distNearestBranch],
      ['DISTANCE FROM SOURCING BRANCH', data.distSourcingBranch],
      ['LOCATION TYPE (SEMI/URBAN/RURAL)', data.locationType],
      ['BUSINESS NAME & OFFICE ADDRESS', data.businessNameAddress],
      ['NO. OF YEARS OF BUSINESS', data.businessVintage],
      ['BUSINESS PREMISES', data.businessPremises],
      ['MONTHLY / FAMILY INCOME DETAILS', data.monthlyIncomeDetails],
      ['CONSIDER INCOME AS PER CREDIT', data.considerIncomeDetails],
      ['NEIGHBOUR REFERENCE 1', data.neighbourRef1],
      ['NEIGHBOUR REFERENCE 2', data.neighbourRef2],
      ['BUSINESS REFERENCE 1', data.businessRef1],
      ['BUSINESS REFERENCE 2', data.businessRef2],
      ['GUARANTOR DETAILS', data.guarantorDetail],
      ['APP CIBIL (NAME : SCORE)', `${data.cibilAppName || '-'} : ${data.cibilAppScore || '-'}`],
      ['CO-APP 1 CIBIL', `${data.cibilCoApp1Name || '-'} : ${data.cibilCoApp1Score || '-'}`],
      ['CO-APP 2 CIBIL', `${data.cibilCoApp2Name || '-'} : ${data.cibilCoApp2Score || '-'}`],
      ['CO-APP 3 CIBIL', `${data.cibilCoApp3Name || '-'} : ${data.cibilCoApp3Score || '-'}`],
      ['LEGAL STATUS', data.legalStatus],
      ['PROPERTY TITLE', data.propertyTitle],
      ['PROPERTY OWNER NAME / RELATION', data.propertyOwner],
      ['ELECTRICITY METER / BILL OWNER', data.electricityDetails],
      ['MARKET VALUE OF PROPERTY (CURRENT RS)', data.marketValue],
      ['END USE OF LOAN', data.endUseLoan],
      ['MONTHLY EMI PAID', data.monthlyEmiPaid],
      ['WAIVER', data.waiver],
      ['REQUIRED DOCS', data.requiredDocs],
      ['DEVIATION & NEGATIVE FINDINGS', data.deviationFindings],
      ['REMARKS', data.remarksNotes],
      ['MITIGATE IF ANY', data.mitigateNotes],
      ['RECOMMENDATION', data.recommendation],
      ['DIRECTION - NORTH', data.dirNorth],
      ['DIRECTION - SOUTH', data.dirSouth],
      ['DIRECTION - EAST', data.dirEast],
      ['DIRECTION - WEST', data.dirWest],
      ['PROPERTY SIZE', data.propertySize],
      ['PD AUTHORISED PERSON', data.pdAuthorisedPerson],
      ['REPORT DATE', data.signDate || data.visitDate]
    ];

    // Sheet 2: Family Tree
    const familyData: (string | number)[][] = [
      ['S.R. No.', 'Customer Name', 'Age', 'Relation With Applicant', 'Business']
    ];

    data.familyMembers.forEach((member, index) => {
      if (member.name || member.age || member.relation || member.business) {
        familyData.push([index + 1, member.name, member.age, member.relation, member.business]);
      }
    });

    // Sheet 3: Credit Evaluation & Property
    const creditData: (string | number)[][] = [
      ['CREDIT OBSERVATIONS & UNDERWRITING'],
      ['Field', 'Details / Observations'],
      ['Applicant CIBIL', `${data.cibilAppName} (${data.cibilAppScore})`],
      ['Co-Applicant 1 CIBIL', `${data.cibilCoApp1Name} (${data.cibilCoApp1Score})`],
      ['Co-Applicant 2 CIBIL', `${data.cibilCoApp2Name} (${data.cibilCoApp2Score})`],
      ['Co-Applicant 3 CIBIL', `${data.cibilCoApp3Name} (${data.cibilCoApp3Score})`],
      ['Existing Loan Detail', data.existingLoans],
      ['Running Obligations (EMI)', data.runningObligations],
      ['Existing Asset / Vehicle', data.assetVehicleDetails],
      ['Legal Status', data.legalStatus],
      ['Property Title', data.propertyTitle],
      ['Property Owner', data.propertyOwner],
      ['Estimated Market Value', data.marketValue],
      ['End Use of Loan', data.endUseLoan],
      ['Recommendation', data.recommendation],
      ['Deviations', data.deviationFindings],
      ['Mitigants', data.mitigateNotes],
      ['Remarks', data.remarksNotes],
      ['Boundaries - North', data.dirNorth],
      ['Boundaries - South', data.dirSouth],
      ['Boundaries - East', data.dirEast],
      ['Boundaries - West', data.dirWest],
      ['Property Dimensions / Size', data.propertySize]
    ];

    const wb = XLSX.utils.book_new();
    const wsGeneral = XLSX.utils.aoa_to_sheet(generalData);
    const wsFamily = XLSX.utils.aoa_to_sheet(familyData);
    const wsCredit = XLSX.utils.aoa_to_sheet(creditData);

    wsGeneral['!cols'] = [{ wch: 38 }, { wch: 70 }];
    wsFamily['!cols'] = [{ wch: 10 }, { wch: 38 }, { wch: 10 }, { wch: 25 }, { wch: 25 }];
    wsCredit['!cols'] = [{ wch: 30 }, { wch: 65 }];

    XLSX.utils.book_append_sheet(wb, wsGeneral, 'PD_Report_Summary');
    XLSX.utils.book_append_sheet(wb, wsFamily, 'Family_Tree');
    XLSX.utils.book_append_sheet(wb, wsCredit, 'Credit_Assessment');

    const cleanFileName = `PD_Report_${custName.replace(/[^a-zA-Z0-9]/g, '_')}_${shopNo || 'Report'}.xlsx`;
    XLSX.writeFile(wb, cleanFileName);
    return { success: true, message: `Excel report ${cleanFileName} downloaded!` };
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Failed to export Excel file.' };
  }
}

export function exportToWord(data: PDReportData) {
  try {
    const custName = data.customerName.trim() || 'Customer';
    const shopNo = data.shopNo.trim() || 'NA';

    let famHtmlRows = '';
    data.familyMembers.forEach((member, i) => {
      if (member.name || member.age || member.relation || member.business) {
        famHtmlRows += `
          <tr>
            <td align="center">${i + 1}</td>
            <td>${member.name || '-'}</td>
            <td align="center">${member.age || '-'}</td>
            <td>${member.relation || '-'}</td>
            <td>${member.business || '-'}</td>
          </tr>
        `;
      }
    });

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>SK Finance - PD Visit Report</title>
        <style>
          body { font-family: 'Calibri', Arial, sans-serif; font-size: 10pt; color: #111; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th, td { border: 1px solid #000000; padding: 4px 6px; font-size: 9.5pt; vertical-align: middle; }
          .header-bar { background-color: #000000; color: #ffffff; font-weight: bold; text-align: center; }
          .title { text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 2px; }
          .subtitle { text-align: center; font-size: 11pt; font-weight: bold; margin-bottom: 6px; }
          .page-break { page-break-before: always; }
          .sign-area { margin-top: 24px; padding-top: 10px; border-top: 1px dashed #333; }
        </style>
      </head>
      <body>
        <!-- PAGE 1 -->
        <div align="right"><b>SHOP No :-</b> ${shopNo}</div>
        <div class="title">S K FINANCE LIMITED</div>
        <div class="subtitle">PD VISIT REPORT (Residence / Business)</div>

        <table>
          <tr>
            <td width="20%"><b>Date:</b></td>
            <td width="30%">${data.visitDate}</td>
            <td width="20%"><b>Location:</b></td>
            <td width="30%">${data.visitLocation}</td>
          </tr>
          <tr>
            <td><b>Customer Name:</b></td>
            <td colspan="3">${data.customerName}</td>
          </tr>
          <tr>
            <td><b>Stability & Residence type:</b></td>
            <td colspan="3">${data.residenceType}</td>
          </tr>
          <tr>
            <td><b>Property address:</b></td>
            <td colspan="3">${data.propertyAddress}</td>
          </tr>
          <tr>
            <td><b>Permanent / Current address:</b></td>
            <td colspan="3">${data.permanentAddress}</td>
          </tr>
          <tr>
            <td><b>Contact Numbers (Verified):</b></td>
            <td colspan="3">${data.contactNumbers}</td>
          </tr>
          <tr>
            <td><b>Distance from Nearest Branch:</b></td>
            <td colspan="3">${data.distNearestBranch}</td>
          </tr>
          <tr>
            <td><b>Distance from Sourcing Branch:</b></td>
            <td colspan="3">${data.distSourcingBranch}</td>
          </tr>
          <tr>
            <td><b>Location Type:</b></td>
            <td colspan="3">${data.locationType}</td>
          </tr>
          <tr>
            <td><b>Business Name & Office Address:</b></td>
            <td colspan="3">${data.businessNameAddress}</td>
          </tr>
          <tr>
            <td><b>No. years of business:</b></td>
            <td>${data.businessVintage}</td>
            <td><b>Business Premises:</b></td>
            <td>${data.businessPremises}</td>
          </tr>
        </table>

        <table style="margin-top: 10px;">
          <tr class="header-bar"><td colspan="2">Monthly Income / Family Income</td></tr>
          <tr><td colspan="2" style="min-height: 50px; padding: 8px;">${data.monthlyIncomeDetails || '(No details recorded)'}</td></tr>
          <tr class="header-bar"><td colspan="2">Consider Income as per credit</td></tr>
          <tr><td colspan="2" style="min-height: 50px; padding: 8px;">${data.considerIncomeDetails || '(No credit observations recorded)'}</td></tr>
        </table>

        <table style="margin-top: 10px;">
          <tr class="header-bar"><td colspan="2">Trade References And Neighbour Reference</td></tr>
          <tr>
            <td width="50%"><b>Neighbour Reference 1:</b><br>${data.neighbourRef1 || '-'}</td>
            <td width="50%"><b>Neighbour Reference 2:</b><br>${data.neighbourRef2 || '-'}</td>
          </tr>
          <tr>
            <td><b>Business Reference 1:</b><br>${data.businessRef1 || '-'}</td>
            <td><b>Business Reference 2:</b><br>${data.businessRef2 || '-'}</td>
          </tr>
        </table>

        <!-- PAGE 2 -->
        <div class="page-break"></div>
        <div class="subtitle">Family Tree (Applicant)</div>
        <table>
          <tr class="header-bar">
            <th width="8%">S.R. No.</th>
            <th width="42%">Customer Name</th>
            <th width="10%">Age</th>
            <th width="20%">Relation With Applicant</th>
            <th width="20%">Business</th>
          </tr>
          ${famHtmlRows || '<tr><td colspan="5" align="center">No family records entered</td></tr>'}
        </table>

        <table>
          <tr class="header-bar"><td>Master tree</td></tr>
          <tr><td style="min-height: 120px; white-space: pre-wrap; padding: 10px;">${data.masterTreeNotes || '-'}</td></tr>
        </table>

        <table>
          <tr class="header-bar"><td>Guarantor detail</td></tr>
          <tr><td align="center" style="font-size: 11pt; font-weight: bold; padding: 15px;">${data.guarantorDetail || 'None'}</td></tr>
        </table>

        <!-- PAGE 3 -->
        <div class="page-break"></div>
        <div class="subtitle">Technical, Legal & Underwriting Check</div>
        <table>
          <tr>
            <td width="25%"><b>CIBIL Score:</b></td>
            <td><b>App:</b> ${data.cibilAppName || '-'} (${data.cibilAppScore || '-'})</td>
            <td><b>Co-App 1:</b> ${data.cibilCoApp1Name || '-'} (${data.cibilCoApp1Score || '-'})</td>
            <td><b>Co-App 2:</b> ${data.cibilCoApp2Name || '-'} (${data.cibilCoApp2Score || '-'})</td>
          </tr>
          <tr>
            <td><b>Existing Loan Detail:</b></td>
            <td colspan="3">${data.existingLoans || '-'}</td>
          </tr>
          <tr>
            <td><b>Running Obligation (EMI):</b></td>
            <td colspan="3">${data.runningObligations || '-'}</td>
          </tr>
          <tr>
            <td><b>Existing Asset / Vehicle:</b></td>
            <td colspan="3">${data.assetVehicleDetails || '-'}</td>
          </tr>
          <tr>
            <td><b>Legal Status:</b></td>
            <td colspan="3"><b>${data.legalStatus}</b></td>
          </tr>
          <tr>
            <td><b>Property Title:</b></td>
            <td colspan="3">${data.propertyTitle || '-'}</td>
          </tr>
          <tr>
            <td><b>Property Owner / Relation:</b></td>
            <td colspan="3">${data.propertyOwner || '-'}</td>
          </tr>
          <tr>
            <td><b>Electricity Meter & Bill Owner:</b></td>
            <td colspan="3">${data.electricityDetails || '-'}</td>
          </tr>
          <tr>
            <td><b>Market Value (Current Rs):</b></td>
            <td colspan="3">${data.marketValue || '-'}</td>
          </tr>
          <tr>
            <td><b>End Use of Loan:</b></td>
            <td colspan="3">${data.endUseLoan || '-'}</td>
          </tr>
          <tr>
            <td><b>Monthly EMI Paid:</b></td>
            <td colspan="3">${data.monthlyEmiPaid || '-'}</td>
          </tr>
          <tr>
            <td><b>Waiver:</b></td>
            <td colspan="3">${data.waiver || '-'}</td>
          </tr>
          <tr>
            <td><b>Required Documents:</b></td>
            <td colspan="3">${data.requiredDocs || '-'}</td>
          </tr>
        </table>

        <table>
          <tr class="header-bar">
            <th width="50%">Deviation & Negative finding if any</th>
            <th width="50%">Remarks</th>
          </tr>
          <tr>
            <td style="min-height: 50px;">${data.deviationFindings || 'None'}</td>
            <td style="min-height: 50px;">${data.remarksNotes || 'None'}</td>
          </tr>
          <tr class="header-bar">
            <th>Mitigate if any</th>
            <th>Recommended / Not Recommended</th>
          </tr>
          <tr>
            <td style="min-height: 50px;">${data.mitigateNotes || 'None'}</td>
            <td align="center" style="font-weight: bold; font-size: 11pt;">${data.recommendation}</td>
          </tr>
        </table>

        <table>
          <tr class="header-bar">
            <th colspan="2">Property Direction</th>
            <th>Property Size</th>
          </tr>
          <tr>
            <td width="20%"><b>NORTH:</b></td><td width="35%">${data.dirNorth || '-'}</td>
            <td rowspan="4" align="center" style="font-weight: bold; font-size: 11pt;">${data.propertySize || 'SAME AS PATTA'}</td>
          </tr>
          <tr><td><b>SOUTH:</b></td><td>${data.dirSouth || '-'}</td></tr>
          <tr><td><b>EAST:</b></td><td>${data.dirEast || '-'}</td></tr>
          <tr><td><b>WEST:</b></td><td>${data.dirWest || '-'}</td></tr>
        </table>

        <div class="sign-area">
          <table style="border: none;">
            <tr style="border: none;">
              <td style="border: none; width: 65%;">
                <b>PD Authorised Person:</b> ${data.pdAuthorisedPerson || '____________________'}
              </td>
              <td style="border: none; width: 35%; text-align: right;">
                <b>Date & Signature:</b> ${data.signDate || data.visitDate || '__________'}
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PD_Report_${custName.replace(/[^a-zA-Z0-9]/g, '_')}_${shopNo || 'Report'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, message: 'Word (.doc) document downloaded!' };
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Failed to export Word document.' };
  }
}

export function exportToJson(data: PDReportData) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const custName = data.customerName.trim() || 'Report';
  a.href = url;
  a.download = `PD_Data_${custName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.shopNo || 'backup'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
