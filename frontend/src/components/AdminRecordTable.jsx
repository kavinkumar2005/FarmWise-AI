import React, { useState } from 'react';
import { 
  Table, ChevronLeft, ChevronRight, Eye, ShieldCheck, 
  AlertCircle, CheckCircle2, Search, Filter, MapPin
} from 'lucide-react';

export default function AdminRecordTable({
  records = [],
  totalCount = 0,
  page = 1,
  pageSize = 25,
  onPageChange = () => {},
  onSelectRecord = () => {},
  onLocateOnMap = () => {},
  onViewRecordDetail = () => {}
}) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3">
      {/* Table Header / Action Row */}
      <div className="p-5 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Crop Cultivation Registry &amp; Verification</h4>
          <p className="text-xs text-slate-500">
            Total {totalCount.toLocaleString()} registered parcel records found
          </p>
        </div>

        {/* Pagination Info */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Record / Parcel</th>
              <th className="py-3 px-4">Survey / Sub</th>
              <th className="py-3 px-4">Village &amp; Taluk</th>
              <th className="py-3 px-4">Crop</th>
              <th className="py-3 px-4">Area</th>
              <th className="py-3 px-4">Health Condition</th>
              <th className="py-3 px-4">Disease / Pest</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {records.map((r) => (
              <tr 
                key={r.id}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                onClick={() => onSelectRecord(r)}
              >
                {/* Priority Badge */}
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 font-black text-[10px] px-2 py-0.5 rounded-md ${
                    r.priority === 'HIGH'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : r.priority === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {r.priority === 'HIGH' ? '🔴 HIGH' : r.priority === 'MEDIUM' ? '🟡 MED' : '🟢 LOW'}
                  </span>
                </td>

                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                  <div>{r.id}</div>
                  <div className="text-[10px] font-normal text-slate-400">{r.parcel_id}</div>
                </td>
                <td className="py-3 px-4 font-mono">
                  <span className="font-semibold text-slate-900">#{r.survey_number}</span>
                  <span className="text-slate-400"> / {r.sub_division}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900">{r.village_name}</div>
                  <div className="text-[10px] text-slate-400">{r.taluk}, {r.district}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                    <span>{r.crop_emoji || '🌱'}</span>
                    <span>{r.crop_name}</span>
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {r.area_acres} ac
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 font-semibold ${
                    r.health_score === null 
                      ? 'text-slate-500' 
                      : r.health_score >= 80 
                      ? 'text-emerald-700' 
                      : r.health_score >= 50 
                      ? 'text-amber-700' 
                      : 'text-rose-700'
                  }`}>
                    <span>{r.health_score !== null ? `${r.health_score}%` : 'N/A'}</span>
                    <span className="text-[10px] text-slate-400">({r.health_status})</span>
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-[11px] font-medium ${
                    r.disease_status === 'No Disease Detected' ? 'text-slate-600' : 'text-rose-700 font-bold'
                  }`}>
                    {r.disease_status || 'None'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.verification_status === 'Verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : r.verification_status === 'Rejected'
                      ? 'bg-slate-200 text-slate-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {r.verification_status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocateOnMap(r);
                      }}
                      className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      title="View crop icon on GIS map"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Map</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewRecordDetail(r.id);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      title="View details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {records.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-slate-400">
                  No crop cultivation records matching the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {records.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(totalCount, page * pageSize)} of {totalCount.toLocaleString()} records
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
