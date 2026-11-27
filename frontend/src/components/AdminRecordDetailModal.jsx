import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, AlertCircle, Edit3, Save, CheckCircle2, 
  MapPin, Calendar, Sprout, User, Eye, Activity, Clock 
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminRecordDetailModal({
  record = null,
  onClose = () => {},
  onRecordUpdated = () => {}
}) {
  if (!record) return null;

  const [localRecord, setLocalRecord] = useState(record);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    crop_name: record.crop_name,
    crop_stage: record.crop_stage,
    area_acres: record.area_acres,
    health_status: record.health_status,
    disease_status: record.disease_status,
    verification_status: record.verification_status,
    reason: ""
  });
  const [rejectReasonModal, setRejectReasonModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLocalRecord(record);
  }, [record]);

  const activeRecord = localRecord || record;

  const showToast = (text, variant = 'success') => {
    setToast({ text, variant });
    setTimeout(() => setToast(null), 3000);
  };

  const handleQuickAction = async (actionType, additionalData = {}) => {
    setIsSubmitting(true);
    try {
      const payload = {
        action: actionType,
        ...additionalData
      };
      const res = await api.updateCropRecord(activeRecord.id, payload);
      const updated = res?.record ? { ...activeRecord, ...res.record } : { ...activeRecord, ...additionalData };
      setLocalRecord(updated);
      onRecordUpdated(updated);
      setRejectReasonModal(false);

      if (actionType === 'VERIFY_RECORD') {
        showToast('Record Verified', 'success');
        setSuccessMsg('Record Verified and logged in audit history.');
      } else if (actionType === 'REJECT_RECORD') {
        showToast('Record Rejected', 'error');
        setSuccessMsg('Record Rejected and logged in audit history.');
      } else if (actionType === 'MARK_REVIEWED') {
        showToast('Alert Marked Reviewed', 'success');
        setSuccessMsg('Alert marked reviewed and logged in audit history.');
      } else {
        showToast('Record Updated', 'success');
        setSuccessMsg(`Action '${actionType}' successfully applied.`);
      }
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error("Action failed:", err);
      alert("Failed to execute admin action. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.updateCropRecord(activeRecord.id, {
        ...formData,
        action: "UPDATE_RECORD",
        reason: formData.reason || "Manual administration adjustment"
      });
      const updated = res?.record ? { ...activeRecord, ...res.record } : { ...activeRecord, ...formData };
      setLocalRecord(updated);
      showToast('Record Updated & Verified', 'success');
      setSuccessMsg("Crop record successfully updated and logged in administrative audit history.");
      setIsEditing(false);
      onRecordUpdated(updated);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.variant === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-emerald-600 text-white border-emerald-500'
          }`}
        >
          {toast.variant === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl">
              {activeRecord.crop_emoji || '🌱'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{activeRecord.crop_name} Cultivation Record</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/20 text-white">
                  {activeRecord.id}
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Parcel ID: {activeRecord.parcel_id} &bull; Survey #{activeRecord.survey_number} / {activeRecord.sub_division}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {!isEditing ? (
            /* View Mode */
            <div className="space-y-6">
              {/* Top Highlights Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Verification</span>
                  <span className={`font-bold inline-flex items-center gap-1 mt-0.5 ${
                    activeRecord.verification_status === 'Verified'
                      ? 'text-emerald-700'
                      : activeRecord.verification_status === 'Rejected'
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {activeRecord.verification_status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cultivated Area</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{record.area_acres} Acres</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Health Score</span>
                  <span className="font-bold text-emerald-700 text-sm mt-0.5 block">{record.health_score}% ({record.health_status})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Season</span>
                  <span className="font-medium text-slate-800 text-xs mt-0.5 block">{record.season}</span>
                </div>
              </div>

              {/* Geographic Jurisdictions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cadastral Geography</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">District</span>
                    <span className="font-semibold text-slate-900">{record.district}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Taluk</span>
                    <span className="font-semibold text-slate-900">{record.taluk}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Revenue Village</span>
                    <span className="font-semibold text-slate-900">{record.village_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Latitude / Longitude</span>
                    <span className="font-mono text-slate-700">{record.latitude.toFixed(5)}°N, {record.longitude.toFixed(5)}°E</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Village LG Code</span>
                    <span className="font-mono text-slate-700">{record.village_code || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Farmer and Cultivation Parameters */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Farmer &amp; Crop Lifecycle</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Farmer ID</span>
                    <span className="font-mono font-semibold text-slate-900">{record.farmer_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Farmer Name (Protected)</span>
                    <span className="font-mono text-slate-700">{record.farmer_name_masked}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Growth Stage</span>
                    <span className="capitalize font-semibold text-slate-900">{record.crop_stage}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Planting Date</span>
                    <span className="font-medium text-slate-700">{record.planting_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Expected Harvest</span>
                    <span className="font-medium text-slate-700">{record.expected_harvest_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Disease / Pest Symptoms</span>
                    <span className="font-medium text-slate-800">{record.disease_status}</span>
                  </div>
                </div>
              </div>

              {/* Priority & Alert Rationale */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-600" />
                  <span>Priority Classification &amp; Triage</span>
                </h4>
                <div className="p-3.5 rounded-2xl border bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase ${
                        record.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : record.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {record.priority || 'LOW'} PRIORITY
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Last updated: {record.last_updated}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs font-medium">
                      <span className="font-bold">Classification Reason:</span> {record.priority_reason || 'Standard verified crop record'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickAction('MARK_REVIEWED', { alert_reviewed: true })}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Mark Alert Reviewed
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAction('VERIFY_RECORD', { verification_status: 'Verified', reason: 'Field officer confirmed cultivation' })}
                    disabled={isSubmitting || activeRecord.verification_status === 'Verified'}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify Record</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRejectReasonModal(true)}
                    disabled={isSubmitting || activeRecord.verification_status === 'Rejected'}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Record</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Crop Information</span>
                </button>
              </div>
            </div>
          ) : (
            /* Edit / Verification Form */
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Modifying this record will register an administrative audit trail entry.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Cultivated Crop</label>
                  <select
                    value={formData.crop_name}
                    onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Rice (Paddy)">🌾 Rice (Paddy)</option>
                    <option value="Coconut">🥥 Coconut</option>
                    <option value="Maize">🌽 Maize</option>
                    <option value="Banana">🍌 Banana</option>
                    <option value="Sugarcane">🍬 Sugarcane</option>
                    <option value="Groundnut">🥜 Groundnut</option>
                    <option value="Sorghum">🌾 Sorghum</option>
                    <option value="Cassava">🥔 Cassava</option>
                    <option value="Marigold">🌼 Marigold</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Growth Stage</label>
                  <select
                    value={formData.crop_stage}
                    onChange={(e) => setFormData({ ...formData, crop_stage: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 capitalize"
                  >
                    <option value="vegetation">Vegetation</option>
                    <option value="full_growth">Full Growth</option>
                    <option value="flowering">Flowering</option>
                    <option value="sown">Sown</option>
                    <option value="harvesting">Harvesting</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Cultivated Area (Acres)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.area_acres}
                    onChange={(e) => setFormData({ ...formData, area_acres: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Health Status</label>
                  <select
                    value={formData.health_status}
                    onChange={(e) => setFormData({ ...formData, health_status: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Verification Status</label>
                  <select
                    value={formData.verification_status}
                    onChange={(e) => setFormData({ ...formData, verification_status: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Not Verified">Not Verified</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Verification Required">Verification Required</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Disease / Pest Notes</label>
                  <input
                    type="text"
                    value={formData.disease_status}
                    onChange={(e) => setFormData({ ...formData, disease_status: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Adjustment Reason (Audit History Log)</label>
                  <input
                    type="text"
                    placeholder="E.g. Field inspection by Revenue Inspector verified banana cultivation"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Saving..." : "Save & Verify Record"}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Rejection Reason Modal */}
        {rejectReasonModal && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Specify Reason for Rejection</span>
              </h4>
              <p className="text-xs text-slate-500">
                The reason will be permanently recorded in the administrative audit log alongside officer credentials.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g. Ground survey revealed land is currently fallow; submitted photo does not match survey number boundary."
                className="w-full h-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectReasonModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectReason.trim() || isSubmitting}
                  onClick={() => handleQuickAction('REJECT_RECORD', { 
                    verification_status: 'Rejected', 
                    reason: rejectReason 
                  })}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
