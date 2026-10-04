import React, { useState } from 'react';
import { PDReportData } from '../types';
import { SignatureModal } from './SignatureModal';
import { PenTool, CheckCircle, AlertTriangle } from 'lucide-react';

interface Page3ReportProps {
  data: PDReportData;
  onChange: <K extends keyof PDReportData>(key: K, value: PDReportData[K]) => void;
}

export const Page3Report: React.FC<Page3ReportProps> = ({ data, onChange }) => {
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  // Helper for CIBIL score visual badge on screen
  const getCibilBadge = (scoreStr: string) => {
    const score = parseInt(scoreStr, 10);
    if (isNaN(score)) return null;
    if (score === -1) {
      return <span className="no-print text-[9px] text-blue-600 font-normal block">New to Credit</span>;
    }
    if (score >= 700) {
      return <span className="no-print text-[9px] text-emerald-600 font-normal block">Prime</span>;
    }
    if (score >= 650) {
      return <span className="no-print text-[9px] text-amber-600 font-normal block">Fair</span>;
    }
    return <span className="no-print text-[9px] text-red-600 font-normal block">Critical</span>;
  };

  return (
    <div className="a4-page" id="page-3">
      <div className="hole-punch hole-top" />
      <div className="hole-punch hole-bottom" />

      <div className="report-sheet">
        {/* CIBIL Scores Header Grid */}
        <table className="doc-table">
          <colgroup>
            <col style={{ width: '32%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '17%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td rowSpan={2} className="field-label" style={{ verticalAlign: 'middle', fontSize: '11px' }}>
                CIBIL Score
              </td>
              <td style={{ fontSize: '9.5px', fontWeight: 700 }}>
                App -{' '}
                <input
                  type="text"
                  value={data.cibilAppName}
                  onChange={(e) => onChange('cibilAppName', e.target.value)}
                  className="form-input handwritten font-bold inline-block"
                  style={{ width: '60%' }}
                  placeholder="KULWANT"
                />
              </td>
              <td style={{ fontSize: '9.5px', fontWeight: 700 }}>
                Co-App -{' '}
                <input
                  type="text"
                  value={data.cibilCoApp1Name}
                  onChange={(e) => onChange('cibilCoApp1Name', e.target.value)}
                  className="form-input handwritten font-bold inline-block"
                  style={{ width: '50%' }}
                  placeholder="CO-APP 1"
                />
              </td>
              <td style={{ fontSize: '9.5px', fontWeight: 700 }}>
                Co-App -{' '}
                <input
                  type="text"
                  value={data.cibilCoApp2Name}
                  onChange={(e) => onChange('cibilCoApp2Name', e.target.value)}
                  className="form-input handwritten font-bold inline-block"
                  style={{ width: '50%' }}
                  placeholder="CO-APP 2"
                />
              </td>
              <td style={{ fontSize: '9.5px', fontWeight: 700 }}>
                Co-App -{' '}
                <input
                  type="text"
                  value={data.cibilCoApp3Name}
                  onChange={(e) => onChange('cibilCoApp3Name', e.target.value)}
                  className="form-input handwritten font-bold inline-block"
                  style={{ width: '50%' }}
                  placeholder="CO-APP 3"
                />
              </td>
            </tr>
            <tr>
              <td className="text-center">
                <input
                  type="text"
                  value={data.cibilAppScore}
                  onChange={(e) => onChange('cibilAppScore', e.target.value)}
                  className="form-input handwritten font-bold text-center text-sm"
                  placeholder="697"
                />
                {getCibilBadge(data.cibilAppScore)}
              </td>
              <td className="text-center">
                <input
                  type="text"
                  value={data.cibilCoApp1Score}
                  onChange={(e) => onChange('cibilCoApp1Score', e.target.value)}
                  className="form-input handwritten font-bold text-center text-sm"
                  placeholder="-1"
                />
                {getCibilBadge(data.cibilCoApp1Score)}
              </td>
              <td className="text-center">
                <input
                  type="text"
                  value={data.cibilCoApp2Score}
                  onChange={(e) => onChange('cibilCoApp2Score', e.target.value)}
                  className="form-input handwritten font-bold text-center text-sm"
                  placeholder=""
                />
                {getCibilBadge(data.cibilCoApp2Score)}
              </td>
              <td className="text-center">
                <input
                  type="text"
                  value={data.cibilCoApp3Score}
                  onChange={(e) => onChange('cibilCoApp3Score', e.target.value)}
                  className="form-input handwritten font-bold text-center text-sm"
                  placeholder=""
                />
                {getCibilBadge(data.cibilCoApp3Score)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Loan, Asset, Property Details Table */}
        <table className="doc-table" style={{ borderTop: 'none' }}>
          <colgroup>
            <col style={{ width: '32%' }} />
            <col style={{ width: '68%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="field-label">
                Existing loan detail & detail Reflection loan in CIBIL/<br />Banking/Cash Paid
              </td>
              <td>
                <input
                  type="text"
                  value={data.existingLoans}
                  onChange={(e) => onChange('existingLoans', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Previous / active borrowings"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">Running obligation (EMI) & house liabilities</td>
              <td>
                <input
                  type="text"
                  value={data.runningObligations}
                  onChange={(e) => onChange('runningObligations', e.target.value)}
                  className="form-input handwritten"
                  placeholder="e.g. Rs. 4,200/month"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">Existing Asset/Vehicle detail if any</td>
              <td>
                <input
                  type="text"
                  value={data.assetVehicleDetails}
                  onChange={(e) => onChange('assetVehicleDetails', e.target.value)}
                  className="form-input handwritten"
                  placeholder="e.g. 2 Maruti Cars, residential house"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">Legal Status</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', fontWeight: 700 }}>
                  <label className="cursor-pointer inline-flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="legalStatus"
                      value="Perfect"
                      checked={data.legalStatus === 'Perfect'}
                      onChange={() => onChange('legalStatus', 'Perfect')}
                      className="h-3.5 w-3.5 accent-blue-600"
                    />
                    <span>Perfect</span>
                  </label>
                  <span style={{ fontWeight: 900, fontSize: '13px' }}>||</span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 text-gray-700">
                    <input
                      type="radio"
                      name="legalStatus"
                      value="Imperfect"
                      checked={data.legalStatus === 'Imperfect'}
                      onChange={() => onChange('legalStatus', 'Imperfect')}
                      className="h-3.5 w-3.5 accent-red-600"
                    />
                    <span>Imperfect</span>
                  </label>
                </div>
              </td>
            </tr>
            <tr>
              <td className="field-label">Property Title</td>
              <td>
                <input
                  type="text"
                  value={data.propertyTitle}
                  onChange={(e) => onChange('propertyTitle', e.target.value)}
                  className="form-input handwritten font-semibold"
                  placeholder="e.g. Reg. GP PATTA / Sale Deed"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">Property owner Name/Relation with Applicant</td>
              <td>
                <input
                  type="text"
                  value={data.propertyOwner}
                  onChange={(e) => onChange('propertyOwner', e.target.value)}
                  className="form-input handwritten font-bold text-sm"
                  placeholder="e.g. REKHA DEVI (Wife)"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">
                Electricity Meter No. & Electricity Bill Owner Name with Relation of Applicant
              </td>
              <td>
                <input
                  type="text"
                  value={data.electricityDetails}
                  onChange={(e) => onChange('electricityDetails', e.target.value)}
                  className="form-input handwritten"
                  placeholder="K.No. / Consumer No. & Owner Name"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">Market value of Property/ Current Rs.</td>
              <td>
                <input
                  type="text"
                  value={data.marketValue}
                  onChange={(e) => onChange('marketValue', e.target.value)}
                  className="form-input handwritten font-semibold"
                  placeholder="e.g. Rs. 24,50,000 /-"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">End use of Loan</td>
              <td>
                <input
                  type="text"
                  value={data.endUseLoan}
                  onChange={(e) => onChange('endUseLoan', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Purpose (e.g. Business expansion, vehicle purchase)"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">Monthly EMI Paid</td>
              <td>
                <input
                  type="text"
                  value={data.monthlyEmiPaid}
                  onChange={(e) => onChange('monthlyEmiPaid', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Serviceability comment / source"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">Waiver</td>
              <td>
                <input
                  type="text"
                  value={data.waiver}
                  onChange={(e) => onChange('waiver', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Waiver requested / NA"
                />
              </td>
            </tr>
            <tr>
              <td className="field-label">Required docs</td>
              <td>
                <input
                  type="text"
                  value={data.requiredDocs}
                  onChange={(e) => onChange('requiredDocs', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Pending documents required prior to disbursement"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Deviation & Remarks Split Box */}
        <table className="doc-table" style={{ borderTop: 'none' }}>
          <colgroup>
            <col style={{ width: '55%' }} />
            <col style={{ width: '45%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="label-header" style={{ borderRight: '1px solid #fff' }}>
                Deviation & Negative finding if any
              </th>
              <th className="label-header">Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ height: '100px', verticalAlign: 'top' }}>
                <textarea
                  value={data.deviationFindings}
                  onChange={(e) => onChange('deviationFindings', e.target.value)}
                  className="form-textarea handwritten"
                  rows={5}
                  placeholder="(Record any negative findings, discrepancies or deviations)"
                />
              </td>
              <td style={{ height: '100px', verticalAlign: 'top' }}>
                <textarea
                  value={data.remarksNotes}
                  onChange={(e) => onChange('remarksNotes', e.target.value)}
                  className="form-textarea handwritten"
                  rows={5}
                  placeholder="(General remarks on applicant demeanor, business stability, premises)"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Mitigate & Recommendation Split Box */}
        <table className="doc-table" style={{ borderTop: 'none' }}>
          <colgroup>
            <col style={{ width: '55%' }} />
            <col style={{ width: '45%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="label-header" style={{ borderRight: '1px solid #fff' }}>
                Mitigate if any
              </th>
              <th className="label-header">Recommended / Not Recommended</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ height: '100px', verticalAlign: 'top' }}>
                <textarea
                  value={data.mitigateNotes}
                  onChange={(e) => onChange('mitigateNotes', e.target.value)}
                  className="form-textarea handwritten"
                  rows={5}
                  placeholder="(Factors mitigating the deviations recorded above)"
                />
              </td>
              <td style={{ height: '100px', verticalAlign: 'middle', textAlign: 'center' }}>
                <div className="space-y-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 font-bold text-xs">
                    <input
                      type="radio"
                      name="recommendation"
                      value="Recommended"
                      checked={data.recommendation === 'Recommended'}
                      onChange={() => onChange('recommendation', 'Recommended')}
                      className="h-3.5 w-3.5 accent-emerald-600"
                    />
                    <span className="text-emerald-900 inline-flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 inline" />
                      Recommended
                    </span>
                  </label>
                  <br />
                  <label className="cursor-pointer inline-flex items-center gap-1.5 font-bold text-xs text-gray-700">
                    <input
                      type="radio"
                      name="recommendation"
                      value="Not Recommended"
                      checked={data.recommendation === 'Not Recommended'}
                      onChange={() => onChange('recommendation', 'Not Recommended')}
                      className="h-3.5 w-3.5 accent-red-600"
                    />
                    <span className="text-red-900 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 inline" />
                      Not Recommended
                    </span>
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Property Direction and Property Size Table */}
        <table className="doc-table" style={{ borderTop: 'none', flex: 1 }}>
          <colgroup>
            <col style={{ width: '25%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '45%' }} />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={2} className="label-header" style={{ borderRight: '1px solid #fff' }}>
                Property Direction
              </th>
              <th className="label-header">Property Size</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 800, textAlign: 'center', fontSize: '10px' }}>NORTH</td>
              <td>
                <input
                  type="text"
                  value={data.dirNorth}
                  onChange={(e) => onChange('dirNorth', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Adjacent property"
                />
              </td>
              <td
                rowSpan={4}
                style={{ verticalAlign: 'middle', textAlign: 'center', position: 'relative' }}
              >
                <input
                  type="text"
                  value={data.propertySize}
                  onChange={(e) => onChange('propertySize', e.target.value)}
                  className="form-input handwritten font-bold text-center"
                  style={{ fontSize: '14px', letterSpacing: '1px' }}
                  placeholder="SAME AS PATTA"
                />
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 800, textAlign: 'center', fontSize: '10px' }}>SOUTH</td>
              <td>
                <input
                  type="text"
                  value={data.dirSouth}
                  onChange={(e) => onChange('dirSouth', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Adjacent property / Road"
                />
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 800, textAlign: 'center', fontSize: '10px' }}>EAST</td>
              <td>
                <input
                  type="text"
                  value={data.dirEast}
                  onChange={(e) => onChange('dirEast', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Adjacent property / Street"
                />
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 800, textAlign: 'center', fontSize: '10px' }}>WEST</td>
              <td>
                <input
                  type="text"
                  value={data.dirWest}
                  onChange={(e) => onChange('dirWest', e.target.value)}
                  className="form-input handwritten"
                  placeholder="Adjacent property"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bottom Footer: PD Authorised Person Name & Signature */}
        <div
          style={{
            borderTop: '1.5px solid #000',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '46px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '60%' }}>
            <span className="label-header" style={{ padding: '2px 6px', fontSize: '9.5px', display: 'inline-block' }}>
              PD Authorised Person Name & Signature:-
            </span>
            <input
              type="text"
              value={data.pdAuthorisedPerson}
              onChange={(e) => onChange('pdAuthorisedPerson', e.target.value)}
              className="form-input handwritten font-bold"
              style={{ borderBottom: '1px solid #000', flex: 1 }}
              placeholder="Credit Officer / PD Manager Name"
            />
          </div>

          <div
            style={{
              width: '38%',
              borderBottom: '1px dashed #777',
              textAlign: 'center',
              fontSize: '10px',
              color: '#444',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '36px',
              cursor: 'pointer'
            }}
            onClick={() => setIsSignModalOpen(true)}
            title="Click to sign or stamp digitally"
          >
            {data.signatureDataUrl ? (
              <div className="relative group/sign flex items-center justify-center">
                <img
                  src={data.signatureDataUrl}
                  alt="Officer Signature"
                  className="h-8 max-w-[160px] object-contain"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSignModalOpen(true);
                  }}
                  className="no-print opacity-0 group-hover/sign:opacity-100 absolute -top-2 -right-6 bg-slate-800 text-white rounded p-0.5 text-[9px]"
                >
                  <PenTool className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition">
                <PenTool className="w-3.5 h-3.5 text-blue-500 no-print" />
                <span>(Sign & Date: {data.signDate || data.visitDate})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSave={(dataUrl) => onChange('signatureDataUrl', dataUrl)}
        officerName={data.pdAuthorisedPerson}
      />
    </div>
  );
};
