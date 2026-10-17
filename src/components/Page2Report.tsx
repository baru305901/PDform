import React from 'react';
import { PDReportData, FamilyMember } from '../types';
import { formatMemberFullName } from '../utils/exportUtils';
import { Plus, Trash2, GitFork } from 'lucide-react';

interface Page2ReportProps {
  data: PDReportData;
  onChange: <K extends keyof PDReportData>(key: K, value: PDReportData[K]) => void;
  onUpdateFamilyMember: (index: number, field: keyof FamilyMember, val: string) => void;
  onAddFamilyRow: () => void;
  onRemoveFamilyRow: (index: number) => void;
}

export const Page2Report: React.FC<Page2ReportProps> = ({
  data,
  onChange,
  onUpdateFamilyMember,
  onAddFamilyRow,
  onRemoveFamilyRow
}) => {
  // Helper to generate a text hierarchy tree into Master tree notes
  const autoGenerateTree = () => {
    const applicant = data.familyMembers.find(
      (m) => m.relation.toLowerCase().includes('self') || m.relation === ''
    ) || data.familyMembers[0];
    const spouse = data.familyMembers.find(
      (m) => m.relation.toLowerCase().includes('wife') || m.relation.toLowerCase().includes('husband')
    );
    const parents = data.familyMembers.filter(
      (m) => m.relation.toLowerCase().includes('father') || m.relation.toLowerCase().includes('mother')
    );
    const children = data.familyMembers.filter(
      (m) =>
        ((m.relation.toLowerCase().includes('son') && !m.relation.toLowerCase().includes('grand') && !m.relation.toLowerCase().includes('law')) ||
          (m.relation.toLowerCase().includes('daughter') && !m.relation.toLowerCase().includes('grand') && !m.relation.toLowerCase().includes('law')) ||
          m.relation.toLowerCase().includes('child')) &&
        m.id !== applicant?.id
    );
    const others = data.familyMembers.filter(
      (m) =>
        m.id !== applicant?.id &&
        m.id !== spouse?.id &&
        !parents.some((p) => p.id === m.id) &&
        !children.some((c) => c.id === m.id) &&
        (m.name || m.relation)
    );

    const getDisplayName = (m?: FamilyMember) => {
      if (!m) return '';
      return formatMemberFullName(m) || m.name || '';
    };

    let tree = '';
    if (parents.length > 0) {
      tree += parents.map((p) => `${getDisplayName(p) || 'Parent'} (${p.relation}, ${p.age || '-'} yrs)`).join('\n') + '\n  └── ';
    }
    tree += `${getDisplayName(applicant) || data.customerName || 'Applicant'} (Applicant, ${applicant?.age || '-'} yrs)`;
    if (spouse) {
      tree += ` + ${getDisplayName(spouse) || 'Spouse'} (${spouse.relation}, ${spouse.age || '-'} yrs)`;
    }
    tree += '\n';

    if (children.length > 0) {
      children.forEach((c, idx) => {
        const isLast = idx === children.length - 1 && others.length === 0;
        tree += `        ${isLast ? '└──' : '├──'} ${getDisplayName(c) || 'Child'} (${c.relation}, ${c.age || '-'} yrs${c.business ? ` - ${c.business}` : ''})\n`;
      });
    }

    if (others.length > 0) {
      others.forEach((o, idx) => {
        const isLast = idx === others.length - 1;
        tree += `        ${isLast ? '└──' : '├──'} ${getDisplayName(o) || 'Member'} (${o.relation || 'Relative'}, ${o.age || '-'} yrs${o.business ? ` - ${o.business}` : ''})\n`;
      });
    }

    onChange('masterTreeNotes', tree.trim());
  };

  // Ensure minimum 10 rows for official sheet format
  const rows = [...data.familyMembers];
  while (rows.length < 10) {
    rows.push({
      id: `${rows.length + 1}`,
      name: '',
      age: '',
      relation: '',
      business: ''
    });
  }

  return (
    <div className="a4-page" id="page-2">
      <div className="hole-punch hole-top" />
      <div className="hole-punch hole-bottom" />

      <div className="report-sheet">
        {/* Header: Family Tree (Applicant) */}
        <div className="label-header" style={{ padding: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ flex: 1, textAlign: 'center' }}>Family Tree (Applicant)</span>
          <div className="no-print flex items-center gap-1">
            <button
              type="button"
              onClick={onAddFamilyRow}
              className="text-[9px] bg-slate-800 hover:bg-slate-700 text-white font-normal px-1.5 py-0.5 rounded border border-slate-600 inline-flex items-center gap-0.5"
              title="Add family row"
            >
              <Plus className="w-2.5 h-2.5" />
              Row
            </button>
          </div>
        </div>

        {/* Family Members Grid Table */}
        <table className="doc-table" id="familyTable">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '47%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', textAlign: 'center', fontWeight: 800 }}>
              <th style={{ border: '1px solid #000', padding: '2px' }}>
                S.R.<br />No.
              </th>
              <th style={{ border: '1px solid #000', padding: '2px' }}>Customer Name</th>
              <th style={{ border: '1px solid #000', padding: '2px' }}>Age</th>
              <th style={{ border: '1px solid #000', padding: '2px' }}>
                Relation With<br />Applicant
              </th>
              <th style={{ border: '1px solid #000', padding: '2px' }}>Business</th>
            </tr>
          </thead>
          <tbody id="familyTableBody">
            {rows.slice(0, 10).map((member, index) => (
              <tr key={member.id || index} className="group/row">
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                <td style={{ padding: '1px 2px' }}>
                  {/* Clean formatted text for A4 physical print & PDF */}
                  <div className="print-only handwritten font-semibold text-[11px] truncate">
                    {formatMemberFullName(member) || member.name || ''}
                  </div>
                  {/* Interactive inputs & relation prefix dropdown for screen editing */}
                  <div className="no-print" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '2px' }}>
                    <input
                      type="text"
                      className="form-input handwritten"
                      style={{ flex: '1 1 50%', minWidth: '0', fontSize: '11px' }}
                      value={member.name}
                      onChange={(e) => onUpdateFamilyMember(index, 'name', e.target.value)}
                      placeholder={index === 0 ? 'Applicant Name' : 'Member Name'}
                    />
                    <select
                      className="form-input handwritten cursor-pointer bg-transparent text-center font-bold text-slate-800"
                      style={{
                        width: '46px',
                        height: '21px',
                        padding: '0 1px',
                        fontSize: '10px',
                        border: '1px solid #94a3b8',
                        borderRadius: '2px',
                        flexShrink: 0
                      }}
                      value={member.prefix || '--'}
                      onChange={(e) =>
                        onUpdateFamilyMember(
                          index,
                          'prefix',
                          e.target.value === '--' ? '' : e.target.value
                        )
                      }
                      title="Relation Prefix (s/o, w/o, d/o, c/o)"
                    >
                      <option value="--">--</option>
                      <option value="s/o">s/o</option>
                      <option value="w/o">w/o</option>
                      <option value="d/o">d/o</option>
                      <option value="c/o">c/o</option>
                    </select>
                    <input
                      type="text"
                      className="form-input handwritten"
                      style={{ flex: '1 1 45%', minWidth: '0', fontSize: '11px' }}
                      value={member.guardianName || ''}
                      onChange={(e) => onUpdateFamilyMember(index, 'guardianName', e.target.value)}
                      placeholder="Father / Spouse"
                    />
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    className="form-input handwritten text-center"
                    value={member.age}
                    onChange={(e) => onUpdateFamilyMember(index, 'age', e.target.value)}
                    placeholder="Age"
                  />
                </td>
                <td>
                  <div className="print-only handwritten text-center font-semibold text-[11px]">
                    {member.relation || ''}
                  </div>
                  <select
                    className="no-print form-input handwritten cursor-pointer bg-transparent"
                    value={member.relation}
                    onChange={(e) => onUpdateFamilyMember(index, 'relation', e.target.value)}
                    style={{ width: '100%', height: '22px' }}
                  >
                    <option value="">-- Select --</option>
                    <option value="Self">Self</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Wife">Wife</option>
                    <option value="Husband">Husband</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Daughter in law">Daughter in law (Bahu)</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Sister-in-law">Sister-in-law (Bhabhi)</option>
                    <option value="Brother-in-law">Brother-in-law</option>
                    <option value="Grandson">Grandson (Pota)</option>
                    <option value="Granddaughter">Granddaughter (Poti)</option>
                    <option value="Grandfather">Grandfather</option>
                    <option value="Grandmother">Grandmother</option>
                    <option value="Other">Other</option>
                    {member.relation &&
                      ![
                        'Self',
                        'Father',
                        'Mother',
                        'Wife',
                        'Husband',
                        'Son',
                        'Daughter',
                        'Daughter in law',
                        'Daughter-in-law',
                        'Brother',
                        'Sister',
                        'Sister-in-law',
                        'Brother-in-law',
                        'Grandson',
                        'Granddaughter',
                        'Grandfather',
                        'Grandmother',
                        'Other',
                        ''
                      ].includes(member.relation) && (
                        <option value={member.relation}>{member.relation}</option>
                      )}
                  </select>
                </td>
                <td className="relative">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      className="form-input handwritten"
                      value={member.business}
                      onChange={(e) => onUpdateFamilyMember(index, 'business', e.target.value)}
                      placeholder="Occupation"
                    />
                    {data.familyMembers.length > 5 && index >= 5 && member.name && (
                      <button
                        type="button"
                        onClick={() => onRemoveFamilyRow(index)}
                        className="no-print opacity-0 group-hover/row:opacity-100 text-red-500 hover:text-red-700 p-0.5 ml-1 transition"
                        title="Remove row"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Master Tree Header & Large Box */}
        <div className="label-header" style={{ marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ flex: 1, textAlign: 'center' }}>Master tree</span>
          <button
            type="button"
            onClick={autoGenerateTree}
            className="no-print text-[9px] bg-slate-800 hover:bg-slate-700 text-amber-300 font-normal px-2 py-0.5 rounded border border-amber-500/40 inline-flex items-center gap-1"
            title="Auto generate hierarchical diagram from family members above"
          >
            <GitFork className="w-2.5 h-2.5" />
            Auto Tree
          </button>
        </div>
        <div
          style={{
            flex: 1,
            borderBottom: '1.5px solid #000',
            minHeight: '440px',
            padding: '8px',
            boxSizing: 'border-box',
            position: 'relative'
          }}
        >
          <textarea
            value={data.masterTreeNotes}
            onChange={(e) => onChange('masterTreeNotes', e.target.value)}
            className="form-textarea handwritten"
            style={{ height: '100%', width: '100%', whiteSpace: 'pre-wrap' }}
            placeholder="(Draw diagram or type master tree hierarchy notes... Click 'Auto Tree' above for structured format)"
          />
        </div>

        {/* Guarantor detail Header & Section */}
        <div className="label-header">
          Guarantor detail
        </div>
        <div
          style={{
            height: '110px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}
        >
          <input
            type="text"
            value={data.guarantorDetail}
            onChange={(e) => onChange('guarantorDetail', e.target.value)}
            className="form-input handwritten font-bold text-center"
            style={{ fontSize: '15px', color: '#1e293b' }}
            placeholder="Guarantor Name, Relation, Net Worth (or 'Guarantor Not Add at PD Visit Time')"
          />
        </div>
      </div>
    </div>
  );
};
