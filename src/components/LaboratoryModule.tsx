import React, { useState } from 'react';
import {
  FlaskConical,
  Glasses,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Wrench,
  Search,
  Filter,
  Trash2,
} from 'lucide-react';
import { LaboratoryJob, Branch, Invoice } from '../types';
import { useLanguage } from '../lib/i18n';
import { useERPStore } from '../lib/erpStore';

interface LaboratoryModuleProps {
  labJobs: LaboratoryJob[];
  branches: Branch[];
  activeBranch: Branch;
  invoices?: Invoice[];
  onUpdateJobStatus: (
    id: string,
    status: LaboratoryJob['status'],
    technicianName?: string,
    repairCost?: number,
    notes?: string
  ) => void;
  onDeleteJob?: (id: string) => void;
}

export const LaboratoryModule: React.FC<LaboratoryModuleProps> = ({
  labJobs,
  branches,
  activeBranch,
  invoices,
  onUpdateJobStatus,
  onDeleteJob,
}) => {
  const { lang, t } = useLanguage();
  const { settings, saveSetting } = useERPStore();
  const labStatusLabels = settings.find((s) => s.id === 'lab_status_labels')?.value || {};
  
  const [selectedJob, setSelectedJob] = useState<LaboratoryJob | null>(null);
  const [techName, setTechName] = useState<string>('Samer Lab Tech');
  const [statusUpdate, setStatusUpdate] = useState<LaboratoryJob['status']>('Lens Edging');
  const [repairCostInput, setRepairCostInput] = useState<number>(0);
  const [notesInput, setNotesInput] = useState<string>('');
  
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editStatusValue, setEditStatusValue] = useState<string>('');

  const statuses: LaboratoryJob['status'][] = [
    'Received at Lab',
    'Lens Edging',
    'Quality Check',
    'Ready for Pickup',
    'Delivered',
    'Frame Broken / Repair',
  ];

  const statusTranslations: Record<LaboratoryJob['status'], { en: string; ar: string }> = {
    'Received at Lab': { en: 'Received at Lab', ar: 'تم الاستلام بالمختبر' },
    'Lens Edging': { en: 'Lens Edging', ar: 'قص وتجهيز العدسات' },
    'Quality Check': { en: 'Quality Check', ar: 'فحص الجودة والمعايرة' },
    'Ready for Pickup': { en: 'Ready for Pickup', ar: 'جاهز للتسليم للفرع' },
    'Delivered': { en: 'Delivered', ar: 'تم التسليم للعميل' },
    'Frame Broken / Repair': { en: 'Frame Broken / Repair', ar: 'صيانة / إصلاح إطار' },
  };

  const getDisplayStatus = (st: string) => {
    return labStatusLabels[st] || statusTranslations[st as LaboratoryJob['status']]?.[lang] || st;
  };

  const handleStartEditStatus = (st: string) => {
    setEditingStatus(st);
    setEditStatusValue(getDisplayStatus(st));
  };

  const handleSaveStatus = (st: string) => {
    const updatedLabels = { ...labStatusLabels, [st]: editStatusValue.trim() };
    saveSetting('lab_status_labels', updatedLabels);
    setEditingStatus(null);
  };

  const handleKeyDownStatus = (e: React.KeyboardEvent, st: string) => {
    if (e.key === 'Enter') handleSaveStatus(st);
    if (e.key === 'Escape') setEditingStatus(null);
  };

  const handleOpenJobModal = (job: LaboratoryJob) => {
    setSelectedJob(job);
    setStatusUpdate(job.status);
    setTechName(job.technicianName || 'Samer Lab Tech');
    setRepairCostInput(job.repairCost || 0);
    setNotesInput('');
  };

  const handleSubmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    onUpdateJobStatus(selectedJob.id, statusUpdate, techName, repairCostInput, notesInput);
    setSelectedJob(null);
  };

  return (
    <div id="laboratory-module" className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'ar' ? 'قسم المختبر وتجهيز العدسات' : 'Laboratory & Lens Edging Module'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar'
                  ? 'متابعة قص وتجهيز العدسات، تركيز البؤرة، صيانة الإطارات، وتوزيع مهام الفنيين.'
                  : 'Track lens surfacing, beveling, assembly status, technician assignment, and repair job orders.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban / Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statuses
          .filter((s) => s !== 'Delivered')
          .map((statusName) => {
            const jobsInStatus = labJobs.filter((j) => j.status === statusName);

            return (
              <div key={statusName} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex-1 cursor-text group flex items-center gap-1" onDoubleClick={() => handleStartEditStatus(statusName)}>
                    {editingStatus === statusName ? (
                      <input
                        type="text"
                        autoFocus
                        value={editStatusValue}
                        onChange={(e) => setEditStatusValue(e.target.value)}
                        onBlur={() => handleSaveStatus(statusName)}
                        onKeyDown={(e) => handleKeyDownStatus(e, statusName)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    ) : (
                      <span onClick={() => handleStartEditStatus(statusName)} title="Click to edit">
                        {getDisplayStatus(statusName)}
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono shrink-0 ml-2">
                    {jobsInStatus.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {jobsInStatus.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-8 font-medium">
                      {lang === 'ar' ? 'لا توجد طلبات في هذه المرحلة' : 'No orders in this stage'}
                    </p>
                  ) : (
                    jobsInStatus.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => handleOpenJobModal(job)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3.5 rounded-xl space-y-2 cursor-pointer transition shadow-xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-blue-600">{job.jobOrderNumber}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{job.sentDate}</span>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 text-xs">{job.customerName}</div>
                          <p className="text-[11px] text-slate-600 font-medium">{job.frameDescription}</p>
                        </div>

                        <div className="text-[10px] text-slate-700 bg-white p-2 rounded-lg font-mono border border-slate-200">
                          <div>R: {job.rightEyePrescription}</div>
                          <div>L: {job.leftEyePrescription}</div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                          <span className="font-medium">
                            {lang === 'ar' ? 'العدسة:' : 'Lens:'} {job.lensType}
                          </span>
                          <span className="text-blue-600 font-bold">
                            {lang === 'ar' ? 'تحديث الحالة ←' : 'Update Status →'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Lab Job Status Update Drawer Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                  {lang === 'ar' ? `تحديث طلب المختبر: #${selectedJob.jobOrderNumber}` : `Update Lab Job: #${selectedJob.jobOrderNumber}`}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {lang === 'ar' ? `العميل: ${selectedJob.customerName}` : `Customer: ${selectedJob.customerName}`}
                </p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitUpdate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'مرحلة حالة المختبر' : 'Laboratory Status Stage'}
                </label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  {statuses.map((st) => (
                    <option key={st} value={st}>
                      {getDisplayStatus(st)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'اسم فني المختبر المسؤول' : 'Assigned Lab Technician'}
                </label>
                <input
                  type="text"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'تكلفة الصيانة / استبدال العدسات (دينار)' : 'Repair / Lens Replacement Cost (JOD)'}
                </label>
                <input
                  type="number"
                  value={repairCostInput}
                  onChange={(e) => setRepairCostInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'ملاحظات الفني / تجهيز الإطار' : 'Technician Notes / Frame Edge Remark'}
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: تم تجهيز العدسات والقص بنجاح. جاهز للإرسال للفرع.' : 'e.g. Completed beveling and quality test. Ready for branch pickup.'}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {onDeleteJob && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(lang === 'ar' ? `هل أنت متأكد من حذف طلب المختبر #${selectedJob.jobOrderNumber}؟` : `Are you sure you want to delete lab job #${selectedJob.jobOrderNumber}?`)) {
                        onDeleteJob(selectedJob.id);
                        setSelectedJob(null);
                      }
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer border border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'حذف الطلب' : 'Delete Job'}
                  </button>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium cursor-pointer text-xs"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-xs cursor-pointer transition text-xs"
                  >
                    {lang === 'ar' ? 'حفظ وتحديث حالة الطلب' : 'Update Lab Status'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

