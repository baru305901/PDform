import React from 'react';
import { PDReportData } from '../types';
import { IncomeDictationAssistant } from './IncomeDictationAssistant';

interface Page1ReportProps {
  data: PDReportData;
  onChange: <K extends keyof PDReportData>(key: K, value: PDReportData[K]) => void;
}

export const Page1Report: React.FC<Page1ReportProps> = ({ data, onChange }) => {
  return (
    <div className="a4-page" id="page-1">
      <div className="hole-punch hole-top" />
      <div className="hole-punch hole-bottom" />

      <div className="report-sheet">
        {/* Top Header: Shop/Lead No */}
        <div style={{ borderBottom: '1.5px solid #000', padding: '2px 8px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '24px' }}>
          <span style={{ fontWeight: 700, fontSize: '11px', marginRight: '4px' }}>SHOP No :-</span>
          <input
            type="text"
            value={data.shopNo}
            onChange={(e) => onChange('shopNo', e.target.value)}
            className="form-input handwritten font-semibold text-center"
            style={{ width: '130px', borderBottom: '1px dotted #555' }}
            placeholder="Shop No."
          />
        </div>

        {/* Company Branding Header */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1.5px solid #000', padding: '4px 10px', gap: '12px', height: '50px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '60px' }}>
            <div style={{ fontSize: '26px', fontWeight: 900, lineHeight: 0.85, letterSpacing: '-1.5px', color: '#000', fontFamily: 'sans-serif' }}>
              sk
            </div>
            <div style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#000' }}>
              FINANCE
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '1px', color: '#000000', fontFamily: "'Arial Black', Arial, sans-serif" }}>
              S K FINANCE LIMITED
            </div>
          </div>
        </div>

        {/* Metadata Row: Date | PD VISIT REPORT | Location */}
        <table className="doc-table" style={{ borderTop: 'none' }}>
          <colgroup>
            <col style={{ width: '8%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '32%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '24%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ fontWeight: 700 }}>Date</td>
              <td>
                <input
                  type="text"
                  value={data.visitDate}
                  onChange={(e) => onChange('visitDate', e.target.value)}
                  className="form-input handwritten font-bold text-center"
                  placeholder="DD/MM/YYYY"
                />
              </td>
              <td className="label-header" style={{ verticalAlign: 'middle', lineHeight: 1.15 }}>
                PD VISIT REPORT<br />
                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'none' }}>
                  Residence/business
                </span>
              </td>
              <td style={{ fontWeight: 700, textAlign: 'center' }}>Location</td>
              <td>
                <input
                  type="text"
                  value={data.visitLocation}
                  onChange={(e) => onChange('visitLocation', e.target.value)}
                  className="form-input handwritten font-semibold"
                  placeholder="Location / Village"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Main Borrower & Residence Details Table */}
        <table className="doc-table" style={{ borderTop: 'none' }}>
          <colgroup>
            <col style={{ width: '32%' }} />
            <col style={{ width: '68%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="field-label">Customer Name: -</td>
              <td>
                <input
                  type="text"
                  value={data.customerName}
                  onChange={(e) => onChange('customerName', e.target.value)}
                  className="form-input handwritten font-bold"
                  style={{ fontSize: '12px' }}
                  placeholder="Primary Borrower Full Name"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">
                Stability & Residence type<br />
                <span style={{ fontSize: '9px', fontWeight: 500 }}>(Own/Rented/Company Provided)</span>
              </td>
              <td style={{ padding: '1px 3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '4px' }}>
                  {/* Left 50%: Dropdown */}
                  <div style={{ width: '50%', borderRight: '1px solid #000', paddingRight: '4px' }}>
                    <select
                      value={data.residenceType || 'Self Owned'}
                      onChange={(e) => onChange('residenceType', e.target.value)}
                      className="form-input handwritten font-semibold cursor-pointer"
                      style={{ width: '100%', background: 'transparent', height: '22px' }}
                    >
                      <option value="Self Owned">Self Owned</option>
                      <option value="Rented">Rented</option>
                      <option value="Company Provided">Company Provided</option>
                    </select>
                  </div>
                  {/* Right 50%: Flexible text input for stability notes */}
                  <div style={{ width: '50%', paddingLeft: '4px' }}>
                    <input
                      type="text"
                      value={data.residenceStabilityNotes || ''}
                      onChange={(e) => onChange('residenceStabilityNotes', e.target.value)}
                      className="form-input handwritten"
                      style={{ width: '100%' }}
                      placeholder="Stay stability / years at address..."
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="field-label">Property address</td>
              <td>
                <input
                  type="text"
                  value={data.propertyAddress}
                  onChange={(e) => onChange('propertyAddress', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Complete property address with PIN"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">Permanent / Current address Address: -</td>
              <td>
                <input
                  type="text"
                  value={data.permanentAddress}
                  onChange={(e) => onChange('permanentAddress', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Same as / or detailed address"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">
                Contact No (verified during visit) all contact No
              </td>
              <td>
                <input
                  type="text"
                  value={data.contactNumbers}
                  onChange={(e) => onChange('contactNumbers', e.target.value)}
                  className="form-input handwritten font-semibold"
                  placeholder="e.g. 9850712701 , 9587691439"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">
                Distance from Nearest Branch<br />
                <span style={{ fontSize: '8.5px', fontWeight: 500 }}>(Property/business/Residence)</span>
              </td>
              <td>
                <input
                  type="text"
                  value={data.distNearestBranch}
                  onChange={(e) => onChange('distNearestBranch', e.target.value)}
                  className="form-input handwritten font-semibold"
                  placeholder="e.g. BEAWAR - 15km"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">
                Distance from Sourcing Branch<br />
                <span style={{ fontSize: '8.5px', fontWeight: 500 }}>(Property/business/Residence)</span>
              </td>
              <td>
                <input
                  type="text"
                  value={data.distSourcingBranch}
                  onChange={(e) => onChange('distSourcingBranch', e.target.value)}
                  className="form-input handwritten font-semibold"
                  placeholder="e.g. BEAWAR - 15km"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">
                Location Type Semi/Urban/<br />Rural or Population in town
              </td>
              <td>
                <input
                  type="text"
                  value={data.locationType}
                  onChange={(e) => onChange('locationType', e.target.value)}
                  className="form-input handwritten font-semibold"
                  placeholder="e.g. Rural / Urban / Semi-Urban"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">
                Business Name/ Office Address: Phone No...
              </td>
              <td>
                <input
                  type="text"
                  value={data.businessNameAddress}
                  onChange={(e) => onChange('businessNameAddress', e.target.value)}
                  className="form-input handwritten font-semibold"
                  placeholder="Business trade name, address & phone"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Vintage & Premises split row */}
        <table className="doc-table" style={{ borderTop: 'none' }}>
          <colgroup>
            <col style={{ width: '32%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '25%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="field-label">No. years of business</td>
              <td>
                <input
                  type="text"
                  value={data.businessVintage}
                  onChange={(e) => onChange('businessVintage', e.target.value)}
                  className="form-input handwritten font-bold text-center"
                  placeholder="e.g. 25 YEARS"
                />
              </td>
              <td className="field-label" style={{ textAlign: 'center' }}>Business Premises</td>
              <td>
                <input
                  type="text"
                  value={data.businessPremises}
                  onChange={(e) => onChange('businessPremises', e.target.value)}
                  className="form-input handwritten font-semibold"
                  placeholder="e.g. Rent / Owner Name - Phone"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Monthly Income Header & Box */}
        <div className="label-header">
          Monthly Income /Family Income
        </div>
        <IncomeDictationAssistant
          customerName={data.customerName}
          businessName={data.businessNameAddress}
          onApplySummary={(summary) => onChange('monthlyIncomeDetails', summary)}
        />
        <div style={{ borderBottom: '1.5px solid #000', height: '175px', padding: '4px', boxSizing: 'border-box' }}>
          <textarea
            value={data.monthlyIncomeDetails}
            onChange={(e) => onChange('monthlyIncomeDetails', e.target.value)}
            className="form-textarea handwritten"
            style={{ height: '100%' }}
            placeholder="(Enter cash flow details, daily/monthly turnover, fees or family earnings)"
          />
        </div>

        {/* Consider Income Header & Box */}
        <div className="label-header">
          Consider Income as per credit
        </div>
        <div style={{ borderBottom: '1.5px solid #000', height: '165px', padding: '4px', boxSizing: 'border-box' }}>
          <textarea
            value={data.considerIncomeDetails}
            onChange={(e) => onChange('considerIncomeDetails', e.target.value)}
            className="form-textarea handwritten"
            style={{ height: '100%' }}
            placeholder="(Credit assessment observations, assessed disposable net income, margin adjustments)"
          />
        </div>

        {/* Trade References and Neighbour Reference Header */}
        <div className="label-header">
          Trade References And Neighbour Reference
        </div>

        {/* References 2x2 Grid */}
        <table className="doc-table" style={{ borderTop: 'none', flex: 1 }}>
          <colgroup>
            <col style={{ width: '26%' }} />
            <col style={{ width: '24%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '24%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="field-label" style={{ fontSize: '9.5px' }}>Neighbour Reference 1 Name & contact no</td>
              <td>
                <input
                  type="text"
                  value={data.neighbourRef1}
                  onChange={(e) => onChange('neighbourRef1', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Name & Contact"
                />
              </td>
              <td className="field-label" style={{ fontSize: '9.5px' }}>Neighbour Reference 2 Name & contact no</td>
              <td>
                <input
                  type="text"
                  value={data.neighbourRef2}
                  onChange={(e) => onChange('neighbourRef2', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Name & Contact"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label" style={{ fontSize: '9.5px' }}>Business Reference 1 Name & contact no</td>
              <td>
                <input
                  type="text"
                  value={data.businessRef1}
                  onChange={(e) => onChange('businessRef1', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Name & Contact"
                />
              </td>
              <td className="field-label" style={{ fontSize: '9.5px' }}>Business Reference 2 Name & contact no</td>
              <td>
                <input
                  type="text"
                  value={data.businessRef2}
                  onChange={(e) => onChange('businessRef2', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Name & Contact"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
