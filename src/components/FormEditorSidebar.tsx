import React, { useState } from 'react';
import { PDReportData } from '../types';
import {
  User,
  Users,
  Building,
  CheckCircle2,
  FileCheck,
  Compass,
  Phone,
  Calendar,
  MapPin,
  Briefcase
} from 'lucide-react';

interface FormEditorSidebarProps {
  data: PDReportData;
  onChange: <K extends keyof PDReportData>(key: K, value: PDReportData[K]) => void;
}

export const FormEditorSidebar: React.FC<FormEditorSidebarProps> = ({ data, onChange }) => {
  const [activeSection, setActiveSection] = useState<'applicant' | 'income' | 'credit' | 'property'>('applicant');

  return (
    <div className="no-print bg-slate-900 border-r border-slate-800 text-slate-200 w-full lg:w-[420px] shrink-0 h-[calc(100vh-60px)] sticky top-[60px] overflow-y-auto flex flex-col p-4 shadow-xl">
      {/* Navigation tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-800 rounded-lg mb-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSection('applicant')}
          className={`py-1.5 px-1 rounded-md text-center transition flex flex-col items-center gap-1 ${
            activeSection === 'applicant' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Client</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('income')}
          className={`py-1.5 px-1 rounded-md text-center transition flex flex-col items-center gap-1 ${
            activeSection === 'income' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Income</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('credit')}
          className={`py-1.5 px-1 rounded-md text-center transition flex flex-col items-center gap-1 ${
            activeSection === 'credit' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>CIBIL</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('property')}
          className={`py-1.5 px-1 rounded-md text-center transition flex flex-col items-center gap-1 ${
            activeSection === 'property' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Property</span>
        </button>
      </div>

      <div className="flex-1 space-y-4 text-xs">
        {activeSection === 'applicant' && (
          <div className="space-y-3">
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              Primary Borrower & Lead Details
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Shop / Lead No.</label>
                <input
                  type="text"
                  value={data.shopNo}
                  onChange={(e) => onChange('shopNo', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Visit Date</label>
                <input
                  type="text"
                  value={data.visitDate}
                  onChange={(e) => onChange('visitDate', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Customer Full Name</label>
              <input
                type="text"
                value={data.customerName}
                onChange={(e) => onChange('customerName', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-medium focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Visit Location</label>
              <input
                type="text"
                value={data.visitLocation}
                onChange={(e) => onChange('visitLocation', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Contact Numbers (Verified)</label>
              <input
                type="text"
                value={data.contactNumbers}
                onChange={(e) => onChange('contactNumbers', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Property Address</label>
              <textarea
                value={data.propertyAddress}
                onChange={(e) => onChange('propertyAddress', e.target.value)}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Residence Type</label>
                <select
                  value={data.residenceType || 'Self Owned'}
                  onChange={(e) => onChange('residenceType', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                >
                  <option value="Self Owned">Self Owned</option>
                  <option value="Rented">Rented</option>
                  <option value="Company Provided">Company Provided</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Stability Notes / Vintage</label>
                <input
                  type="text"
                  value={data.residenceStabilityNotes || ''}
                  onChange={(e) => onChange('residenceStabilityNotes', e.target.value)}
                  placeholder="e.g. 15 yrs stay, ancestral"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Location Type</label>
                <input
                  type="text"
                  value={data.locationType}
                  onChange={(e) => onChange('locationType', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Dist. Nearest Branch</label>
                <input
                  type="text"
                  value={data.distNearestBranch}
                  onChange={(e) => onChange('distNearestBranch', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Dist. Nearest Branch</label>
                <input
                  type="text"
                  value={data.distNearestBranch}
                  onChange={(e) => onChange('distNearestBranch', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Dist. Sourcing Branch</label>
                <input
                  type="text"
                  value={data.distSourcingBranch}
                  onChange={(e) => onChange('distSourcingBranch', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'income' && (
          <div className="space-y-3">
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              Business & Financial Assessment
            </h4>

            <div>
              <label className="text-slate-400 block mb-1">Business Name & Office Address</label>
              <input
                type="text"
                value={data.businessNameAddress}
                onChange={(e) => onChange('businessNameAddress', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Vintage (Years)</label>
                <input
                  type="text"
                  value={data.businessVintage}
                  onChange={(e) => onChange('businessVintage', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Premises Ownership</label>
                <input
                  type="text"
                  value={data.businessPremises}
                  onChange={(e) => onChange('businessPremises', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Monthly / Family Income Observations</label>
              <textarea
                value={data.monthlyIncomeDetails}
                onChange={(e) => onChange('monthlyIncomeDetails', e.target.value)}
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Consider Income as per Credit</label>
              <textarea
                value={data.considerIncomeDetails}
                onChange={(e) => onChange('considerIncomeDetails', e.target.value)}
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
              />
            </div>
          </div>
        )}

        {activeSection === 'credit' && (
          <div className="space-y-3">
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              CIBIL & Underwriting Checks
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Applicant Name</label>
                <input
                  type="text"
                  value={data.cibilAppName}
                  onChange={(e) => onChange('cibilAppName', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Applicant Score</label>
                <input
                  type="text"
                  value={data.cibilAppScore}
                  onChange={(e) => onChange('cibilAppScore', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Co-Applicant 1</label>
                <input
                  type="text"
                  value={data.cibilCoApp1Name}
                  onChange={(e) => onChange('cibilCoApp1Name', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Co-App 1 Score</label>
                <input
                  type="text"
                  value={data.cibilCoApp1Score}
                  onChange={(e) => onChange('cibilCoApp1Score', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Existing Loans Detail</label>
              <input
                type="text"
                value={data.existingLoans}
                onChange={(e) => onChange('existingLoans', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Running Obligations (EMI)</label>
              <input
                type="text"
                value={data.runningObligations}
                onChange={(e) => onChange('runningObligations', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Credit Recommendation</label>
              <div className="flex gap-4 mt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="sidebarRecommendation"
                    value="Recommended"
                    checked={data.recommendation === 'Recommended'}
                    onChange={() => onChange('recommendation', 'Recommended')}
                    className="accent-emerald-500"
                  />
                  <span className="text-emerald-400 font-semibold">Recommended</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="sidebarRecommendation"
                    value="Not Recommended"
                    checked={data.recommendation === 'Not Recommended'}
                    onChange={() => onChange('recommendation', 'Not Recommended')}
                    className="accent-red-500"
                  />
                  <span className="text-red-400 font-semibold">Not Recommended</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'property' && (
          <div className="space-y-3">
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Property & Technical Valuation
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Legal Status</label>
                <select
                  value={data.legalStatus}
                  onChange={(e) => onChange('legalStatus', e.target.value as 'Perfect' | 'Imperfect')}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                >
                  <option value="Perfect">Perfect</option>
                  <option value="Imperfect">Imperfect</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Estimated Market Value</label>
                <input
                  type="text"
                  value={data.marketValue}
                  onChange={(e) => onChange('marketValue', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Property Title</label>
              <input
                type="text"
                value={data.propertyTitle}
                onChange={(e) => onChange('propertyTitle', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Property Owner</label>
              <input
                type="text"
                value={data.propertyOwner}
                onChange={(e) => onChange('propertyOwner', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
              />
            </div>

            <div className="space-y-1.5 border-t border-slate-800 pt-2">
              <label className="text-slate-400 block font-semibold">Boundaries & Directions</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500">North</label>
                  <input
                    type="text"
                    value={data.dirNorth}
                    onChange={(e) => onChange('dirNorth', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">South</label>
                  <input
                    type="text"
                    value={data.dirSouth}
                    onChange={(e) => onChange('dirSouth', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">East</label>
                  <input
                    type="text"
                    value={data.dirEast}
                    onChange={(e) => onChange('dirEast', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">West</label>
                  <input
                    type="text"
                    value={data.dirWest}
                    onChange={(e) => onChange('dirWest', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">PD Authorised Person</label>
              <input
                type="text"
                value={data.pdAuthorisedPerson}
                onChange={(e) => onChange('pdAuthorisedPerson', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
