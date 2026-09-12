import React, { useState } from 'react';
import {
  PhoneCall,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Clock,
  User,
  Sparkles,
  Phone,
  Send,
  Building2,
  Gift,
  Globe,
} from 'lucide-react';
import { CallReminder, Branch } from '../types';
import { useLanguage } from '../lib/i18n';

export interface WhatsAppTemplateOptions {
  customerName: string;
  templateType: CallReminder['ruleType'] | 'appointment_reminder' | string;
  branchName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  discountPercent?: number;
  invoiceNumber?: string;
  language?: 'en' | 'ar' | 'both';
}

/**
 * Helper function within CallCenterModule to generate pre-filled WhatsApp 
 * message templates for appointment reminders, birthday greetings, and follow-ups.
 */
export function generateWhatsAppTemplate(options: WhatsAppTemplateOptions): string {
  const {
    customerName = 'Valued Customer',
    templateType,
    branchName = 'OptiVision Optical',
    appointmentDate = 'Tomorrow',
    appointmentTime = '11:00 AM',
    discountPercent = 20,
    invoiceNumber,
    language = 'both',
  } = options;

  switch (templateType) {
    case 'appointment_reminder':
      if (language === 'ar') {
        return `مرحباً ${customerName}، نود تذكيرك بموعد فحص النظر لدى مركز ${branchName} بتاريخ ${appointmentDate} الساعة ${appointmentTime}. يرجى تأكيد الحضور بالرد على هذه الرسالة. نتطلع لرؤيتك!`;
      }
      if (language === 'en') {
        return `Hello ${customerName}! This is a friendly reminder for your upcoming eye checkup at ${branchName} scheduled for ${appointmentDate} at ${appointmentTime}. Please reply 'YES' to confirm or contact us to reschedule.`;
      }
      return `Hello ${customerName}! 👋 Appointment Reminder / تذكير بموعد
This is a friendly reminder for your upcoming eye checkup at ${branchName} scheduled for ${appointmentDate} at ${appointmentTime}.
مرحباً بك، نود تذكيرك بموعد فحص النظر لدى ${branchName} بتاريخ ${appointmentDate} الساعة ${appointmentTime}. Please reply to confirm!`;

    case 'birthday_greeting':
      if (language === 'ar') {
        return `كل عام وأنت بخير يا ${customerName}! 🎉 طاقم ${branchName} يتمنى لك يوم ميلاد سعيد. يسعدنا إهداؤك خصم عيد الميلاد بقيمة ${discountPercent}% على جميع الإطارات والنظارات الشمسية الفاخرة!`;
      }
      if (language === 'en') {
        return `Happy Birthday ${customerName}! 🎉 Wishing you a wonderful day from all of us at ${branchName}. Enjoy an exclusive ${discountPercent}% VIP Birthday Discount on luxury designer frames and sunglasses!`;
      }
      return `Happy Birthday ${customerName}! 🎉 كل عام وأنت بخير!
Wishing you a wonderful birthday from all of us at ${branchName}! To celebrate, we invite you to enjoy an exclusive ${discountPercent}% VIP Birthday Discount on luxury designer frames and sunglasses. Visit us or reply to claim your special birthday voucher!`;

    case 'post_sale_satisfaction':
      const invText = invoiceNumber ? ` (Invoice #${invoiceNumber})` : '';
      if (language === 'ar') {
        return `مرحباً ${customerName}، معك طاقم ${branchName}. نود الاطمئنان على راحة نظارتك الجديدة${invText}! هل ترتاح بصرك مع العدسات الجديدة؟ نرحب بك دائماً لأي تعديل بسيط مجاني.`;
      }
      if (language === 'en') {
        return `Hello ${customerName}, this is ${branchName} following up on your recent eyeglasses purchase${invText}! We want to ensure your vision is 100% comfortable. Please let us know if you need any frame adjustments!`;
      }
      return `Hello ${customerName}! 👋 OptiVision Satisfaction Check
This is ${branchName} following up on your recent eyeglasses purchase${invText}. We want to ensure your vision is 100% comfortable!
نود الاطمئنان على راحة عينيك مع النظارة الجديدة. Please reply or visit us anytime for complimentary fitting adjustments!`;

    case '6_month_eye_check':
      if (language === 'ar') {
        return `مرحباً ${customerName}، لقد مر 6 أشهر على آخر فحص نظر لك لدى ${branchName}. الفحص الدوري يحافظ على صحة عينيك ودقة رؤيتك. احجز موعدك المجاني القادم الآن بالرد على هذه الرسالة!`;
      }
      if (language === 'en') {
        return `Hello ${customerName}, it has been 6 months since your last eye exam at ${branchName}. Routine checkups keep your vision crystal clear! Reply to book your complimentary re-examination.`;
      }
      return `Hello ${customerName}! 👁️ Eye Checkup Due / فحص النظر الدوري
It has been 6 months since your last eye exam at ${branchName}.
لقد مر 6 أشهر على آخر فحص نظر لك لدى ${branchName}. Reply to book your complimentary vision re-examination today!`;

    case '1_month_contact_lens_reminder':
      if (language === 'ar') {
        return `مرحباً ${customerName}، تذكير من ${branchName}: قد حان موعد استبدال أو تجديد مخزون العدسات اللاصقة. تواصل معنا بالرد لطلب علبتك الجديدة مع خدمة التوصيل المتاحة!`;
      }
      if (language === 'en') {
        return `Hello ${customerName}, your contact lens supply from ${branchName} may be due for replacement! Reply to reserve your fresh box or request convenient home delivery.`;
      }
      return `Hello ${customerName}! 👁️✨ Contact Lens Refill
Your contact lens supply from ${branchName} may be due for replacement!
تذكير بتجديد مخزون العدسات اللاصقة لدى ${branchName}. Reply to reserve your fresh box or request home delivery!`;

    case 'custom_followup':
    default:
      if (language === 'ar') {
        return `مرحباً ${customerName}، تحياتنا لك من ${branchName}. كيف يمكننا خدمتك اليوم بالنسبة لنظارتك أو عدساتك؟`;
      }
      if (language === 'en') {
        return `Hello ${customerName}, greetings from ${branchName}! How can we assist you with your eyewear or optical prescription today?`;
      }
      return `Hello ${customerName}, greetings from ${branchName}! مرحباً بك لدى ${branchName}. How can we assist you with your eyewear today?`;
  }
}

interface CallCenterModuleProps {
  callReminders: CallReminder[];
  branches: Branch[];
  activeBranch: Branch;
  onUpdateCallStatus: (
    id: string,
    status: CallReminder['status'],
    notes?: string,
    rescheduleDate?: string
  ) => void;
}

export const CallCenterModule: React.FC<CallCenterModuleProps> = ({
  callReminders,
  branches,
  activeBranch,
  onUpdateCallStatus,
}) => {
  const { lang, t } = useLanguage();
  const [selectedRuleFilter, setSelectedRuleFilter] = useState<string>('ALL');
  const [activeReminderModal, setActiveReminderModal] = useState<CallReminder | null>(null);
  const [callNotes, setCallNotes] = useState<string>('');
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('post_sale_satisfaction');
  const [templateLang, setTemplateLang] = useState<'en' | 'ar' | 'both'>('both');
  const [apptDate, setApptDate] = useState<string>('Tomorrow');
  const [apptTime, setApptTime] = useState<string>('11:00 AM');
  const [bdayDiscount, setBdayDiscount] = useState<number>(20);
  const [whatsappPreview, setWhatsappPreview] = useState<string>('');

  const updateDraftText = (
    type: string,
    l: 'en' | 'ar' | 'both',
    reminder: CallReminder | null,
    dateVal: string,
    timeVal: string,
    discVal: number
  ) => {
    if (!reminder) return;
    const msg = generateWhatsAppTemplate({
      customerName: reminder.customerName,
      templateType: type as any,
      branchName: activeBranch.name,
      appointmentDate: dateVal,
      appointmentTime: timeVal,
      discountPercent: discVal,
      invoiceNumber: reminder.invoiceNumber,
      language: l,
    });
    setWhatsappPreview(msg);
  };

  const ruleTypeLabels: Record<CallReminder['ruleType'], { label: string; days: string; color: string }> = {
    'post_sale_satisfaction': {
      label: lang === 'ar' ? 'متابعة ما بعد البيع' : 'Post-Sale Satisfaction Check',
      days: lang === 'ar' ? 'بعد إغلاق الفاتورة' : 'Upon Invoice Closing',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    '6_month_eye_check': {
      label: lang === 'ar' ? 'تذكير فحص النظر (بعد 6 أشهر)' : '6-Month Eye Exam Reminder',
      days: lang === 'ar' ? 'بعد 6 أشهر' : '+6 Months Post-Invoice',
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    '1_month_contact_lens_reminder': {
      label: lang === 'ar' ? 'تجديد العدسات اللاصقة (شهر)' : '1-Month Contact Lens Refill',
      days: lang === 'ar' ? 'بعد شهر' : '+1 Month Post-Invoice',
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    'birthday_greeting': {
      label: lang === 'ar' ? 'تهنئة عيد الميلاد المميزة' : 'Birthday VIP Greeting',
      days: lang === 'ar' ? 'سنوي' : 'Annual Birthday',
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    'custom_followup': {
      label: lang === 'ar' ? 'متابعة مخصصة' : 'Custom Follow-Up',
      days: lang === 'ar' ? 'محدد بجدول' : 'Scheduled',
      color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    },
  };

  const filteredReminders = callReminders.filter((r) => {
    if (selectedRuleFilter !== 'ALL' && r.ruleType !== selectedRuleFilter) return false;
    return true;
  });

  const handleOpenCallModal = (reminder: CallReminder) => {
    setActiveReminderModal(reminder);
    setCallNotes('');

    const initialType = reminder.ruleType || 'appointment_reminder';
    setSelectedTemplateType(initialType);
    setTemplateLang(lang === 'ar' ? 'ar' : 'both');
    setApptDate('Tomorrow');
    setApptTime('11:00 AM');
    setBdayDiscount(20);

    updateDraftText(initialType, lang === 'ar' ? 'ar' : 'both', reminder, 'Tomorrow', '11:00 AM', 20);
  };

  const handleCompleteCall = (status: CallReminder['status']) => {
    if (!activeReminderModal) return;
    onUpdateCallStatus(activeReminderModal.id, status, callNotes);
    setActiveReminderModal(null);
  };

  return (
    <div id="call-center-module" className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'ar' ? 'مركز الاتصالات وقواعد متابعة العملاء' : 'Call Center & CRM Follow-up Rules'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar'
                  ? 'قواعد التواصل التلقائي (متابعة 3 أيام، فحص 6 أشهر، تجديد العدسات، وأعياد الميلاد).'
                  : 'Automated customer engagement rules (+3 Days Satisfaction, +6 Months Eye Check, +1 Month Contacts, Birthdays).'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {lang === 'ar' ? 'قاعدة 1: +3 أيام' : 'Rule 1: +3 Days'}
          </span>
          <h4 className="font-bold text-slate-900 text-xs">
            {lang === 'ar' ? 'متابعة رضا الزبون عن النظارة' : 'Customer Satisfaction Call'}
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">
            {lang === 'ar' ? 'تُفعل تلقائياً بعد 3 أيام من الاستلام للاطمئنان على وضوح الرؤية.' : 'Triggered 3 days after invoice completion for vision comfort check.'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {lang === 'ar' ? 'قاعدة 2: +6 أشهر' : 'Rule 2: +6 Months'}
          </span>
          <h4 className="font-bold text-slate-900 text-xs">
            {lang === 'ar' ? 'تذكير فحص النظر الدوري' : 'Eye Check Exam Reminder'}
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">
            {lang === 'ar' ? 'تُفعل بعد 6 أشهر لإجراء فحص النظر الدوري المجاني.' : 'Triggered 6 months post prescription purchase for re-examination.'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            {lang === 'ar' ? 'قاعدة 3: +1 شهر' : 'Rule 3: +1 Month'}
          </span>
          <h4 className="font-bold text-slate-900 text-xs">
            {lang === 'ar' ? 'تجديد العدسات اللاصقة' : 'Contact Lens Replacement'}
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">
            {lang === 'ar' ? 'تُفعل بعد شهر لتذكير مستخدمي العدسات بتجديد العلبة.' : 'Reminds contact lens wearers to replenish fresh lenses.'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {lang === 'ar' ? 'قاعدة 4: عيد الميلاد' : 'Rule 4: Birthday'}
          </span>
          <h4 className="font-bold text-slate-900 text-xs">
            {lang === 'ar' ? 'تهنئة وقسيمة خصم VIP' : 'VIP Birthday Greeting'}
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">
            {lang === 'ar' ? 'إرسال تهنئة مخصصة مع قسيمة خصم مميزة على النظارات.' : 'Sends personalized birthday wishes & exclusive discount voucher.'}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-xs text-slate-500 font-bold px-2 shrink-0">
          {lang === 'ar' ? 'تصفية القاعدة:' : 'Filter Rule:'}
        </span>
        <button
          onClick={() => setSelectedRuleFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 border transition ${
            selectedRuleFilter === 'ALL'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {lang === 'ar' ? 'جميع التذكيرات المجدولة' : 'All Scheduled Reminders'}
        </button>
        {Object.entries(ruleTypeLabels).map(([key, item]) => (
          <button
            key={key}
            onClick={() => setSelectedRuleFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 border transition ${
              selectedRuleFilter === key
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Reminders Queue Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-100 uppercase font-bold text-[10px] text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-3.5">{lang === 'ar' ? 'القاعدة / المحفز' : 'Rule / Trigger'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'اسم العميل ورقم الهاتف' : 'Customer Name & Phone'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'التاريخ المجدول' : 'Scheduled Date'}</th>
                <th className="p-3.5">{t('status')}</th>
                <th className="p-3.5 text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {filteredReminders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    {lang === 'ar' ? 'لا توجد اتصالات مجدولة مطابقة للتصفية.' : 'No scheduled call tasks matching filter.'}
                  </td>
                </tr>
              ) : (
                filteredReminders.map((rem) => {
                  const ruleMeta = ruleTypeLabels[rem.ruleType] || ruleTypeLabels['custom_followup'];

                  return (
                    <tr key={rem.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${ruleMeta.color}`}
                        >
                          {ruleMeta.label}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{rem.customerName}</div>
                        <div className="font-mono text-blue-600 text-[10px] font-medium">{rem.phone}</div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-500 font-medium">
                        {rem.invoiceNumber || 'N/A'}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {rem.scheduledDate}
                      </td>

                      <td className="p-3.5">
                        {rem.status === 'Pending' ? (
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                            {lang === 'ar' ? 'اتصال معلق' : 'Pending Call'}
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                            {rem.status === 'Completed' ? (lang === 'ar' ? 'تم الاتصال' : 'Completed') : rem.status}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenCallModal(rem)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5 ml-auto"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {lang === 'ar' ? 'تسجيل الاتصال / واتساب' : 'Log Call / WhatsApp'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call Log & WhatsApp Sender Modal */}
      {activeReminderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  {lang === 'ar' ? 'تواصل CRM ورسائل الواتساب' : 'CRM Customer Outreach & WhatsApp'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {activeReminderModal.customerName} ({activeReminderModal.phone})
                </p>
              </div>
              <button
                onClick={() => setActiveReminderModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Template Controls Header */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {lang === 'ar' ? 'اختر نموذج رسالة الواتساب' : 'Select WhatsApp Message Template'}
                  </span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                    <Globe className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    {[
                      { id: 'both', label: lang === 'ar' ? 'ثنائي' : 'Bilingual' },
                      { id: 'en', label: 'EN' },
                      { id: 'ar', label: 'العربية' },
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          const lCode = l.id as 'en' | 'ar' | 'both';
                          setTemplateLang(lCode);
                          updateDraftText(
                            selectedTemplateType,
                            lCode,
                            activeReminderModal,
                            apptDate,
                            apptTime,
                            bdayDiscount
                          );
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer ${
                          templateLang === l.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template Preset Buttons */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'appointment_reminder', label: lang === 'ar' ? '📅 تذكير بالموعد' : '📅 Appointment Reminder' },
                    { id: 'birthday_greeting', label: lang === 'ar' ? '🎉 تهنئة عيد الميلاد' : '🎉 Birthday VIP Greeting' },
                    { id: 'post_sale_satisfaction', label: lang === 'ar' ? '👓 متابعة بعد البيع' : '👓 Post-Sale Check' },
                    { id: '6_month_eye_check', label: lang === 'ar' ? '👁️ فحص 6 أشهر' : '👁️ +6M Eye Exam' },
                    { id: '1_month_contact_lens_reminder', label: lang === 'ar' ? '👁️✨ تجديد العدسات' : '👁️✨ Contact Lens Refill' },
                    { id: 'custom_followup', label: lang === 'ar' ? '💬 متابعة مخصصة' : '💬 Custom Followup' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateType(tpl.id);
                        updateDraftText(
                          tpl.id,
                          templateLang,
                          activeReminderModal,
                          apptDate,
                          apptTime,
                          bdayDiscount
                        );
                      }}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border text-left transition cursor-pointer truncate ${
                        selectedTemplateType === tpl.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                {/* Dynamic Parameter Options */}
                {selectedTemplateType === 'appointment_reminder' && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        {lang === 'ar' ? 'تاريخ الموعد' : 'Appt Date'}
                      </label>
                      <input
                        type="text"
                        value={apptDate}
                        onChange={(e) => {
                          setApptDate(e.target.value);
                          updateDraftText(
                            selectedTemplateType,
                            templateLang,
                            activeReminderModal,
                            e.target.value,
                            apptTime,
                            bdayDiscount
                          );
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-[11px] text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        {lang === 'ar' ? 'وقت الموعد' : 'Appt Time'}
                      </label>
                      <input
                        type="text"
                        value={apptTime}
                        onChange={(e) => {
                          setApptTime(e.target.value);
                          updateDraftText(
                            selectedTemplateType,
                            templateLang,
                            activeReminderModal,
                            apptDate,
                            e.target.value,
                            bdayDiscount
                          );
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-[11px] text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                )}

                {selectedTemplateType === 'birthday_greeting' && (
                  <div className="pt-1 border-t border-slate-200 flex items-center gap-3">
                    <label className="text-[10px] font-bold text-slate-600 shrink-0">
                      {lang === 'ar' ? 'نسبة الخصم %:' : 'Birthday Discount %:'}
                    </label>
                    <input
                      type="number"
                      value={bdayDiscount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setBdayDiscount(val);
                        updateDraftText(
                          selectedTemplateType,
                          templateLang,
                          activeReminderModal,
                          apptDate,
                          apptTime,
                          val
                        );
                      }}
                      className="w-20 bg-white border border-slate-200 rounded p-1.5 text-[11px] font-bold text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* WhatsApp Draft Preview */}
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-800 text-[11px]">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    {lang === 'ar' ? 'مسودة نص رسالة الواتساب' : 'Auto WhatsApp Draft Message'}
                  </span>
                  <a
                    href={`https://wa.me/${activeReminderModal.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      whatsappPreview
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {lang === 'ar' ? 'فتح واتساب ' : 'Open WhatsApp Web '}
                    <Send className="w-3 h-3" />
                  </a>
                </div>
                <textarea
                  rows={4}
                  value={whatsappPreview}
                  onChange={(e) => setWhatsappPreview(e.target.value)}
                  className="w-full bg-white border border-emerald-200 text-slate-800 text-xs font-medium rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              {/* Call Notes */}
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'ملاحظات نتيجة الاتصال' : 'Agent Call Outcome Notes'}
                </label>
                <textarea
                  rows={2}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: تم إرسال الرسالة وتم تأكيد الحضور من قبل الزبون.' : 'e.g. Sent appointment reminder via WhatsApp. Customer confirmed for 11:00 AM.'}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCompleteCall('Completed')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === 'ar' ? 'تحديد كـ تم الاتصال' : 'Mark as Contacted'}
                </button>

                <button
                  type="button"
                  onClick={() => handleCompleteCall('Rescheduled')}
                  className="bg-slate-100 hover:bg-slate-200 text-amber-800 font-bold py-2.5 rounded-lg border border-slate-200 cursor-pointer transition"
                >
                  {lang === 'ar' ? 'إعادة جدولة لاحقاً' : 'Reschedule Later'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
