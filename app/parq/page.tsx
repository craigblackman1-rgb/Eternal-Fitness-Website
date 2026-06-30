"use client";

import React, { useState, useRef } from "react";
import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  section2Questions,
  section3Questions,
  section4Questions,
  section6bQuestions,
  questionTextMap,
  parqSections,
} from "@/lib/parq-data";

interface ParqFormData {
  fullName: string;
  dateOfBirth: string;
  address: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  gpName: string;
  gpSurgery: string;
  gpPhone: string;
  q1: "yes" | "no" | "";
  q2: "yes" | "no" | "";
  q3: "yes" | "no" | "";
  q4: "yes" | "no" | "";
  q5: "yes" | "no" | "";
  q6: "yes" | "no" | "";
  q7: "yes" | "no" | "";
  q8: "yes" | "no" | "";
  q9: "yes" | "no" | "";
  q10: "yes" | "no" | "";
  q11: "yes" | "no" | "";
  q12: "yes" | "no" | "";
  q13: "yes" | "no" | "";
  q14: "yes" | "no" | "";
  q15: "yes" | "no" | "";
  q16: "yes" | "no" | "";
  q17: "yes" | "no" | "";
  q18: "yes" | "no" | "";
  q19: "yes" | "no" | "";
  q20: "yes" | "no" | "";
  q21: "yes" | "no" | "";
  q22: "yes" | "no" | "";
  q23: "yes" | "no" | "";
  q24: "yes" | "no" | "";
  q25: "yes" | "no" | "";
  q26: "yes" | "no" | "";
  conditions: string;
  medications: string;
  devices: string;
  exerciseRestrictions: string;
  surgeries: string;
  otherInfo: string;
  currentExercise: string;
  trainingGoals: string;
  q27: "yes" | "no" | "";
  q28: "yes" | "no" | "";
  q29: "yes" | "no" | "";
  clientNamePrint: string;
  clientSignatureDate: string;
  clientSignature: string;
  clientTypedSignature: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const initialFormData: ParqFormData = {
  fullName: "",
  dateOfBirth: "",
  address: "",
  email: "",
  phone: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  gpName: "",
  gpSurgery: "",
  gpPhone: "",
  q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "", q8: "", q9: "", q10: "", q11: "",
  q12: "", q13: "", q14: "", q15: "", q16: "", q17: "", q18: "",
  q19: "", q20: "", q21: "", q22: "", q23: "", q24: "", q25: "", q26: "",
  conditions: "",
  medications: "",
  devices: "",
  exerciseRestrictions: "",
  surgeries: "",
  otherInfo: "",
  currentExercise: "",
  trainingGoals: "",
  q27: "", q28: "", q29: "",
  clientNamePrint: "",
  clientSignatureDate: "",
  clientSignature: "",
  clientTypedSignature: "",
};

const yesNoOptions: ("yes" | "no")[] = ["yes", "no"];

export default function ParqPage() {
  const [formData, setFormData] = useState<ParqFormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedAccurate, setConfirmedAccurate] = useState(false);
  const [confirmedClearance, setConfirmedClearance] = useState(false);
  const [consentGpContact, setConsentGpContact] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof ParqFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const anyYesInSection2 = formData.q1 === "yes" || formData.q2 === "yes" || formData.q3 === "yes" || formData.q4 === "yes" || formData.q5 === "yes" || formData.q6 === "yes" || formData.q7 === "yes" || formData.q8 === "yes" || formData.q9 === "yes" || formData.q10 === "yes" || formData.q11 === "yes";
  const anyYesInSection3 = formData.q12 === "yes" || formData.q13 === "yes" || formData.q14 === "yes" || formData.q15 === "yes" || formData.q16 === "yes" || formData.q17 === "yes" || formData.q18 === "yes";
  const anyYesInSection4 = formData.q19 === "yes" || formData.q20 === "yes" || formData.q21 === "yes" || formData.q22 === "yes" || formData.q23 === "yes" || formData.q24 === "yes" || formData.q25 === "yes" || formData.q26 === "yes";
  const hasAnyYes = anyYesInSection2 || anyYesInSection3 || anyYesInSection4;

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    const requiredFields: (keyof ParqFormData)[] = [
      "fullName", "dateOfBirth", "address", "email", "phone",
      "emergencyContactName", "emergencyContactPhone",
      "gpName", "gpSurgery",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = "This field is required";
      }
    });

    const questions: (keyof ParqFormData)[] = [
      "q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11",
      "q12","q13","q14","q15","q16","q17","q18",
      "q19","q20","q21","q22","q23","q24","q25","q26",
      "q27","q28","q29",
    ];

    questions.forEach((q) => {
      if (!formData[q]) {
        newErrors[q] = "Required";
      }
    });

    if (hasAnyYes) {
      const section5Fields: (keyof ParqFormData)[] = ["conditions", "medications"];
      section5Fields.forEach((field) => {
        if (!formData[field]) {
          newErrors[field] = "Required when YES answers are given";
        }
      });
    }

    if (formData.q27 === "yes" && !formData.dateOfBirth) {
      newErrors.dateOfBirth = "Required";
    }

    const hasClientSignature = formData.clientSignature || formData.clientTypedSignature;
    if (!hasClientSignature) {
      newErrors.clientSignature = "A signature is required";
    }
    if (!formData.clientNamePrint) {
      newErrors.clientNamePrint = "This field is required";
    }
    if (!formData.clientSignatureDate) {
      newErrors.clientSignatureDate = "This field is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!confirmedAccurate) {
      newErrors.confirmedAccurate = "You must confirm this declaration";
    }
    if (!confirmedClearance) {
      newErrors.confirmedClearance = "You must confirm this declaration";
    }
    if (!consentGpContact) {
      newErrors.consentGpContact = "You must confirm this consent";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      const firstError = document.querySelector("[data-error-first]");
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/parq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save PAR-Q form");
      }

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const inputClass = (field: string) =>
    cn(
      "w-full rounded-md border border-[#D9D9D9] bg-white px-3 py-2 text-[#1E1E1E] text-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E8B] focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      errors[field] && "border-red-500 focus-visible:ring-red-500"
    );

  const textareaClass = (field: string) =>
    cn(
      "w-full rounded-md border border-[#D9D9D9] bg-white px-3 py-2 text-[#1E1E1E] text-sm min-h-[80px]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E8B] focus-visible:ring-offset-2",
      errors[field] && "border-red-500 focus-visible:ring-red-500"
    );

  const YesNoGroup = ({ field, label }: { field: keyof ParqFormData; label: string }) => (
    <div className="flex items-center gap-4">
      {yesNoOptions.map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name={field}
            value={opt}
            checked={formData[field] === opt}
            onChange={() => handleChange(field, opt)}
            className="h-4 w-4 text-[#087E8B] focus:ring-[#087E8B]"
          />
          {opt.toUpperCase()}
        </label>
      ))}
      {errors[field] && (
        <span className="text-red-600 text-xs" role="alert">{errors[field]}</span>
      )}
    </div>
  );

  if (isSubmitted) {
    const formatDate = (d: string) => {
      if (!d) return "—";
      const date = new Date(d + "T00:00:00");
      return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    };

    const sections = [
      { label: "Section 2 — Cardiovascular and General Health", questions: section2Questions.map(q => q.q) },
      { label: "Section 3 — Musculoskeletal, Neurological, and Surgical History", questions: section3Questions.map(q => q.q) },
      { label: "Section 4 — Blood Conditions, Medications, and Diagnosed Conditions", questions: section4Questions.map(q => q.q) },
      { label: "Section 6 — Additional Questions", questions: section6bQuestions.map(q => q.q) },
    ];

    return (
      <div className="min-h-screen bg-[#F1F1F1] py-8 px-4">
        <div
          ref={formRef}
          className="max-w-4xl mx-auto bg-white rounded-lg shadow-md print:shadow-none print:rounded-none"
          role="document"
          aria-label="Signed PAR-Q Form"
        >
          {/* Header */}
          <header className="border-b-4 border-[#087E8B] px-6 pt-8 pb-6 print:pb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">
              Eternal <span className="text-[#C1839F]">♥</span> Fitness
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-[#087E8B] mt-2">
              PAR-Q · Physical Activity Readiness Questionnaire — Signed Copy
            </h2>
            <p className="text-[#525A61] mt-2 text-sm italic">
              Completed by {formData.fullName} on {formatDate(formData.clientSignatureDate)}
            </p>
            <div className="bg-[#F1F1F1] rounded-md p-4 mt-4">
              <p className="text-sm text-[#1E1E1E] leading-relaxed">
                All information provided is treated as strictly confidential and held securely in accordance with UK data protection legislation (UK GDPR / Data Protection Act 2018).
              </p>
            </div>
          </header>

          {/* Success banner - hidden on print */}
          <div className="px-6 py-4 bg-green-50 border-b border-green-200 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#087E8B] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-green-800 font-semibold text-sm">PAR-Q form saved successfully</p>
                <p className="text-green-700 text-xs">Esther will review your responses before your first session. Use the button below to print.</p>
              </div>
            </div>
          </div>

          {/* Print actions - hidden on print */}
          <div className="px-6 py-4 flex gap-3 print:hidden">
            <Button onClick={handlePrint} className="bg-[#087E8B] text-white hover:bg-[#087E8B]/90">
              Print this form
            </Button>
            <Button
              onClick={() => {
                setIsSubmitted(false);
                setFormData(initialFormData);
                setConfirmedAccurate(false);
                setConfirmedClearance(false);
                setConsentGpContact(false);
                setSubmitError(null);
              }}
              variant="outline"
            >
              Start again
            </Button>
          </div>

          {/* Completed form content */}
          <div className="px-6 py-6 space-y-8 text-sm text-[#1E1E1E]">
            {/* Section 1: Personal Details */}
            <section>
              <h2 className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 1 — Personal Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">Full name</p>
                  <p className="mt-1 font-medium">{formData.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">Date of birth</p>
                  <p className="mt-1">{formatDate(formData.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">Email</p>
                  <p className="mt-1">{formData.email}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">Address</p>
                  <p className="mt-1">{formData.address}</p>
                </div>
                <div>
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">Phone</p>
                  <p className="mt-1">{formData.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">Emergency contact</p>
                  <p className="mt-1">{formData.emergencyContactName} — {formData.emergencyContactPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">GP name</p>
                  <p className="mt-1">{formData.gpName}</p>
                </div>
                <div>
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">GP surgery</p>
                  <p className="mt-1">{formData.gpSurgery}</p>
                </div>
                <div>
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">GP phone</p>
                  <p className="mt-1">{formData.gpPhone || "—"}</p>
                </div>
              </div>
            </section>

            {/* Sections 2, 3, 4, 6: Questions */}
            {sections.map(({ label, questions }) => (
              <section key={label}>
                <h2 className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                  {label}
                </h2>
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div key={q} className="bg-[#F1F1F1] rounded-md p-3 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-[#1E1E1E] font-medium">{questionTextMap[q]}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={cn(
                          "inline-block px-3 py-1 rounded-full text-xs font-bold uppercase",
                          formData[q as keyof ParqFormData] === "yes"
                            ? "bg-red-100 text-red-800"
                            : formData[q as keyof ParqFormData] === "no"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        )}>
                          {formData[q as keyof ParqFormData] || "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Section 5: Full Details */}
            <section>
              <h2 className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 5 — Full Details
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Diagnosed medical conditions", value: formData.conditions },
                  { label: "All current prescription medications", value: formData.medications },
                  { label: "Implanted medical devices", value: formData.devices },
                  { label: "Exercise restrictions", value: formData.exerciseRestrictions },
                  { label: "Surgeries or hospital admissions (last 5 years)", value: formData.surgeries },
                  { label: "Any other information", value: formData.otherInfo },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">{label}</p>
                    <p className="mt-1 whitespace-pre-wrap">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 6b: Lifestyle */}
            <section>
              <h2 className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 6 — Lifestyle and Physical Activity
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">Current exercise or sport</p>
                  <p className="mt-1 whitespace-pre-wrap">{formData.currentExercise || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">Training goals</p>
                  <p className="mt-1 whitespace-pre-wrap">{formData.trainingGoals || "—"}</p>
                </div>
              </div>
            </section>

            {/* Section 7: Medical Clearance */}
            <section>
              <h2 className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 7 — Medical Clearance Record
              </h2>
              <div className="bg-[#F1F1F1] rounded-md p-4">
                <p className="text-sm text-[#525A61] italic">To be completed by the trainer.</p>
              </div>
            </section>

            {/* Section 9: Declaration and Signature */}
            <section>
              <h2 className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 9 — Declaration and Signature
              </h2>

              <div className="bg-[#F1F1F1] rounded-md p-4 mb-6 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p className="text-sm text-[#1E1E1E]">
                    I confirm that the information I have provided in this form is accurate and complete to the best of my knowledge.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p className="text-sm text-[#1E1E1E]">
                    I understand that where my trainer determines medical clearance is required, no training sessions will commence until that clearance has been received in writing.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p className="text-sm text-[#1E1E1E]">
                    I consent to my trainer contacting my GP for the purpose of requesting medical clearance where this is deemed necessary for my safety.
                  </p>
                </div>
              </div>

              {/* Client signature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">Client full name (print)</p>
                  <p className="mt-1 font-medium">{formData.clientNamePrint}</p>
                </div>
                <div>
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">Date</p>
                  <p className="mt-1">{formatDate(formData.clientSignatureDate)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide mb-2">Client signature</p>
                  {formData.clientTypedSignature ? (
                    <p className="italic font-serif text-lg text-[#1E1E1E]">{formData.clientTypedSignature}</p>
                  ) : formData.clientSignature ? (
                    <img src={formData.clientSignature} alt="Client signature" className="h-16 border-b border-[#D9D9D9]" />
                  ) : (
                    <p className="text-[#525A61] italic">Signed</p>
                  )}
                </div>
              </div>

              {/* Trainer signature */}
              <div className="bg-[#F1F1F1] rounded-md p-4 mb-8">
                <p className="text-sm text-[#525A61] mb-3">
                  Trainer signature applied automatically upon client submission.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">Trainer name (print)</p>
                    <p className="mt-1 font-medium">Esther Fair</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#525A61] font-medium uppercase tracking-wide">Trainer signature</p>
                    <p className="mt-1 italic font-serif text-lg text-[#1E1E1E]">Esther Fair</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8: Annual Review */}
            <section>
              <h2 className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 8 — Annual Review Record
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                <p className="text-sm text-amber-900 font-semibold">This form must be reviewed every 12 months or following any change in health status.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" role="table" aria-label="Annual review record">
                  <thead>
                    <tr className="bg-[#087E8B] text-white">
                      <th className="text-left p-3 font-semibold" scope="col">Review date</th>
                      <th className="text-left p-3 font-semibold" scope="col">Changes to health, medications, or conditions</th>
                      <th className="text-left p-3 font-semibold" scope="col">Client signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3].map((i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F1F1F1]"}>
                        <td className="p-3 border-t border-[#D9D9D9] h-12">&nbsp;</td>
                        <td className="p-3 border-t border-[#D9D9D9]">&nbsp;</td>
                        <td className="p-3 border-t border-[#D9D9D9]">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Footer */}
          <footer className="border-t border-[#D9D9D9] px-6 py-4 text-center text-xs text-[#525A61] print:border-t-0">
            <p>
              Eternal <span className="text-[#C1839F]">♥</span> Fitness · PAR-Q / Medical Health Screening · Confidential — held securely on file
            </p>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1]">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div
          ref={formRef}
          className="bg-white rounded-lg shadow-md print:shadow-none print:rounded-none"
          role="document"
          aria-label="PAR-Q Physical Activity Readiness Questionnaire"
        >
          {/* Header */}
          <header className="border-b-4 border-[#087E8B] px-6 pt-8 pb-6 print:pb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">
              Eternal <span className="text-[#C1839F]">♥</span> Fitness
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-[#087E8B] mt-2">
              PAR-Q · Physical Activity Readiness Questionnaire
            </h2>
            <p className="text-[#525A61] mt-2 text-sm italic" role="note">
              Medical Health Screening · Strictly Confidential
            </p>
            <div className="bg-[#F1F1F1] rounded-md p-4 mt-4">
              <p className="text-sm text-[#1E1E1E] leading-relaxed">
                All information provided is treated as strictly confidential and held securely in accordance with UK data protection legislation (UK GDPR / Data Protection Act 2018). Information will not be shared with third parties without your written consent.
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit} noValidate className="px-6 py-6 space-y-8">
            {/* Submit error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
                <p className="text-red-800 text-sm font-semibold">Error saving form</p>
                <p className="text-red-700 text-sm mt-1">{submitError}</p>
              </div>
            )}

            {/* Error summary */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert" aria-labelledby="error-summary-heading">
                <h3 id="error-summary-heading" className="text-red-800 font-semibold text-sm mb-2">
                  Please correct the following errors:
                </h3>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>
                      <a href={`#field-${field}`} className="underline hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
                        {message}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section 1: Personal Details */}
            <section aria-labelledby="personal-details-heading">
              <h2 id="personal-details-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 1 — Personal Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2" data-error-first>
                  <Label htmlFor="fullName" className="text-[#1E1E1E] font-medium">Full name <span className="text-red-600" aria-hidden="true">*</span></Label>
                  <Input id="fullName" type="text" value={formData.fullName} onChange={(e) => handleChange("fullName", e.target.value)} className={inputClass("fullName")} required aria-required="true" aria-invalid={!!errors.fullName} />
                  {errors.fullName && <p className="text-red-600 text-xs mt-1" role="alert">{errors.fullName}</p>}
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-[#1E1E1E] font-medium">Date of birth <span className="text-red-600" aria-hidden="true">*</span></Label>
                  <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => handleChange("dateOfBirth", e.target.value)} className={inputClass("dateOfBirth")} required aria-required="true" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-[#1E1E1E] font-medium">Email address <span className="text-red-600" aria-hidden="true">*</span></Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} className={inputClass("email")} required aria-required="true" aria-invalid={!!errors.email} />
                  {errors.email && <p className="text-red-600 text-xs mt-1" role="alert">{errors.email}</p>}
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address" className="text-[#1E1E1E] font-medium">Address <span className="text-red-600" aria-hidden="true">*</span></Label>
                  <Input id="address" type="text" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} className={inputClass("address")} required aria-required="true" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-[#1E1E1E] font-medium">Phone number <span className="text-red-600" aria-hidden="true">*</span></Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} className={inputClass("phone")} required aria-required="true" />
                </div>
                <div>
                  <Label htmlFor="emergencyContactName" className="text-[#1E1E1E] font-medium">Emergency contact name <span className="text-red-600" aria-hidden="true">*</span></Label>
                  <Input id="emergencyContactName" type="text" value={formData.emergencyContactName} onChange={(e) => handleChange("emergencyContactName", e.target.value)} className={inputClass("emergencyContactName")} required aria-required="true" />
                </div>
                <div>
                  <Label htmlFor="emergencyContactPhone" className="text-[#1E1E1E] font-medium">Emergency contact phone <span className="text-red-600" aria-hidden="true">*</span></Label>
                  <Input id="emergencyContactPhone" type="tel" value={formData.emergencyContactPhone} onChange={(e) => handleChange("emergencyContactPhone", e.target.value)} className={inputClass("emergencyContactPhone")} required aria-required="true" />
                </div>
                <div>
                  <Label htmlFor="gpName" className="text-[#1E1E1E] font-medium">GP name <span className="text-red-600" aria-hidden="true">*</span></Label>
                  <Input id="gpName" type="text" value={formData.gpName} onChange={(e) => handleChange("gpName", e.target.value)} className={inputClass("gpName")} required aria-required="true" />
                </div>
                <div>
                  <Label htmlFor="gpSurgery" className="text-[#1E1E1E] font-medium">GP surgery name and address <span className="text-red-600" aria-hidden="true">*</span></Label>
                  <Input id="gpSurgery" type="text" value={formData.gpSurgery} onChange={(e) => handleChange("gpSurgery", e.target.value)} className={inputClass("gpSurgery")} required aria-required="true" />
                </div>
                <div>
                  <Label htmlFor="gpPhone" className="text-[#1E1E1E] font-medium">GP phone number</Label>
                  <Input id="gpPhone" type="tel" value={formData.gpPhone} onChange={(e) => handleChange("gpPhone", e.target.value)} className={inputClass("gpPhone")} />
                </div>
              </div>
            </section>

            {/* Section 2: Cardiovascular and General Health */}
            <section aria-labelledby="cardio-heading">
              <h2 id="cardio-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 2 — Cardiovascular and General Health
              </h2>
              <p className="text-sm text-[#525A61] mb-4 italic">Circle YES or NO for every question. If you answer YES to any question, your trainer will discuss this with you before your programme begins.</p>
              <div className="space-y-4">
                {section2Questions.map(({ q, text, note }) => (
                  <div key={q} className="bg-[#F1F1F1] rounded-md p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-[#1E1E1E] font-medium">Q{q.replace("q", "")}. {text}</p>
                        {note && <p className="text-xs text-[#525A61] mt-1 italic">{note}</p>}
                      </div>
                      <YesNoGroup field={q as keyof ParqFormData} label={`Question ${q}`} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Musculoskeletal, Neurological, and Surgical History */}
            <section aria-labelledby="musculo-heading">
              <h2 id="musculo-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 3 — Musculoskeletal, Neurological, and Surgical History
              </h2>
              <div className="space-y-4">
                {section3Questions.map(({ q, text, note }) => (
                  <div key={q} className="bg-[#F1F1F1] rounded-md p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-[#1E1E1E] font-medium">Q{q.replace("q", "")}. {text}</p>
                        {note && <p className="text-xs text-[#525A61] mt-1 italic">{note}</p>}
                      </div>
                      <YesNoGroup field={q as keyof ParqFormData} label={`Question ${q}`} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4: Blood Conditions, Medications, and Diagnosed Conditions */}
            <section aria-labelledby="blood-heading">
              <h2 id="blood-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 4 — Blood Conditions, Medications, and Diagnosed Conditions
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                <p className="text-sm text-amber-900 font-semibold">This section is critical for your safety — please complete in full.</p>
                <p className="text-sm text-amber-800 mt-1">Some medications and blood conditions significantly affect how your body responds to exercise and your risk of injury. Please disclose ALL medications, supplements, and diagnosed conditions — even if you do not think they are relevant.</p>
              </div>
              <div className="space-y-4">
                {section4Questions.map(({ q, text, note }) => (
                  <div key={q} className="bg-[#F1F1F1] rounded-md p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-[#1E1E1E] font-medium">Q{q.replace("q", "")}. {text}</p>
                        {note && <p className="text-xs text-[#525A61] mt-1 italic">{note}</p>}
                      </div>
                      <YesNoGroup field={q as keyof ParqFormData} label={`Question ${q}`} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: Full Details */}
            <section aria-labelledby="details-heading">
              <h2 id="details-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 5 — Full Details
              </h2>
              <p className="text-sm text-[#525A61] mb-4 italic">Complete this section for every YES answer — reference the question number. You must complete this section for every YES answer above.</p>
              <div className="space-y-6">
                <div data-error-first>
                  <Label htmlFor="conditions" className="text-[#1E1E1E] font-medium mb-2 block">
                    Diagnosed medical conditions <span className="text-[#525A61] font-normal text-sm">(list each condition, date of diagnosis, and name of treating doctor or consultant)</span>
                  </Label>
                  <Textarea id="conditions" value={formData.conditions} onChange={(e) => handleChange("conditions", e.target.value)} className={textareaClass("conditions")} placeholder="E.g. Type 2 Diabetes — diagnosed March 2023 — Dr. Smith, Worthing Hospital" />
                  {errors.conditions && <p className="text-red-600 text-xs mt-1" role="alert">{errors.conditions}</p>}
                </div>
                <div>
                  <Label htmlFor="medications" className="text-[#1E1E1E] font-medium mb-2 block">
                    All current prescription medications <span className="text-[#525A61] font-normal text-sm">(list each medication, dosage, and what it is prescribed for)</span>
                  </Label>
                  <Textarea id="medications" value={formData.medications} onChange={(e) => handleChange("medications", e.target.value)} className={textareaClass("medications")} placeholder="E.g. Metformin 500mg — twice daily — Type 2 Diabetes" />
                  {errors.medications && <p className="text-red-600 text-xs mt-1" role="alert">{errors.medications}</p>}
                </div>
                <div>
                  <Label htmlFor="devices" className="text-[#1E1E1E] font-medium mb-2 block">
                    Implanted medical devices <span className="text-[#525A61] font-normal text-sm">(describe each device, when inserted, and any restrictions)</span>
                  </Label>
                  <Textarea id="devices" value={formData.devices} onChange={(e) => handleChange("devices", e.target.value)} className={textareaClass("devices")} placeholder="E.g. None" />
                </div>
                <div>
                  <Label htmlFor="exerciseRestrictions" className="text-[#1E1E1E] font-medium mb-2 block">
                    Exercise restrictions <span className="text-[#525A61] font-normal text-sm">(list any specific restrictions given by a medical professional and who gave them)</span>
                  </Label>
                  <Textarea id="exerciseRestrictions" value={formData.exerciseRestrictions} onChange={(e) => handleChange("exerciseRestrictions", e.target.value)} className={textareaClass("exerciseRestrictions")} placeholder="E.g. Avoid heavy spinal loading — Mr. Jones, Orthopaedic Consultant" />
                </div>
                <div>
                  <Label htmlFor="surgeries" className="text-[#1E1E1E] font-medium mb-2 block">
                    Surgeries or hospital admissions in the last 5 years <span className="text-[#525A61] font-normal text-sm">(list each with date, procedure, and hospital)</span>
                  </Label>
                  <Textarea id="surgeries" value={formData.surgeries} onChange={(e) => handleChange("surgeries", e.target.value)} className={textareaClass("surgeries")} placeholder="E.g. June 2024 — Knee arthroscopy — St. Richard's Hospital, Chichester" />
                </div>
                <div>
                  <Label htmlFor="otherInfo" className="text-[#1E1E1E] font-medium mb-2 block">
                    Any other information <span className="text-[#525A61] font-normal text-sm">(anything you think your trainer should know)</span>
                  </Label>
                  <Textarea id="otherInfo" value={formData.otherInfo} onChange={(e) => handleChange("otherInfo", e.target.value)} className={textareaClass("otherInfo")} placeholder="E.g. None" />
                </div>
              </div>
            </section>

            {/* Section 6: Lifestyle and Physical Activity */}
            <section aria-labelledby="lifestyle-heading">
              <h2 id="lifestyle-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 6 — Lifestyle and Physical Activity
              </h2>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="currentExercise" className="text-[#1E1E1E] font-medium mb-2 block">
                    What types of exercise or sport do you currently do? <span className="text-[#525A61] font-normal text-sm">(include frequency and duration)</span>
                  </Label>
                  <Textarea id="currentExercise" value={formData.currentExercise} onChange={(e) => handleChange("currentExercise", e.target.value)} className={textareaClass("currentExercise")} placeholder="E.g. Walking 20 minutes daily, light stretching twice a week" />
                </div>
                <div>
                  <Label htmlFor="trainingGoals" className="text-[#1E1E1E] font-medium mb-2 block">
                    What are your goals for working with a personal trainer?
                  </Label>
                  <Textarea id="trainingGoals" value={formData.trainingGoals} onChange={(e) => handleChange("trainingGoals", e.target.value)} className={textareaClass("trainingGoals")} placeholder="E.g. Regain strength after cancer treatment, improve mobility and confidence" />
                </div>
                <div className="space-y-4">
                  {section6bQuestions.map(({ q, text, note }) => (
                    <div key={q} className="bg-[#F1F1F1] rounded-md p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-[#1E1E1E] font-medium">Q{q.replace("q", "")}. {text}</p>
                          {note && <p className="text-xs text-[#525A61] mt-1 italic">{note}</p>}
                        </div>
                        <YesNoGroup field={q as keyof ParqFormData} label={`Question ${q}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 7: Medical Clearance Record */}
            <section aria-labelledby="clearance-heading">
              <h2 id="clearance-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 7 — Medical Clearance Record
              </h2>
              <p className="text-sm text-[#525A61] mb-4 italic">To be completed by the trainer.</p>
              <div className="bg-[#F1F1F1] rounded-md p-4">
                <p className="text-sm text-[#1E1E1E] mb-3">
                  If the client has answered YES to any question in Sections 2, 3, or 4, the trainer will assess whether medical clearance is required before commencing exercise. Where clearance is required, no sessions should be delivered until a signed letter from the GP or relevant consultant has been received and placed on file.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#1E1E1E] font-medium text-sm">Medical clearance required?</Label>
                    <p className="text-sm text-[#525A61] mt-1 italic">{hasAnyYes ? "To be assessed by trainer" : "Not required — no YES answers"}</p>
                  </div>
                  <div>
                    <Label className="text-[#1E1E1E] font-medium text-sm">GP / consultant letter received?</Label>
                    <p className="text-sm text-[#525A61] mt-1 italic">To be completed by trainer</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 9: Declaration and Signature */}
            <section aria-labelledby="declaration-heading">
              <h2 id="declaration-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 9 — Declaration and Signature
              </h2>

              <div className="bg-[#F1F1F1] rounded-md p-4 mb-6 space-y-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="confirmedAccurate" checked={confirmedAccurate} onChange={(e) => setConfirmedAccurate(e.target.checked)} className="mt-1 h-4 w-4 rounded border-[#D9D9D9] text-[#087E8B] focus:ring-[#087E8B] focus:ring-offset-0 cursor-pointer" aria-required="true" aria-invalid={!!errors.confirmedAccurate} />
                  <Label htmlFor="confirmedAccurate" className="text-sm text-[#1E1E1E] cursor-pointer">
                    I confirm that the information I have provided in this form is accurate and complete to the best of my knowledge. I understand that withholding or providing inaccurate health information may put my safety at risk. <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                </div>
                {errors.confirmedAccurate && <p className="text-red-600 text-xs mt-1 ml-7" role="alert">{errors.confirmedAccurate}</p>}

                <div className="flex items-start gap-3">
                  <input type="checkbox" id="confirmedClearance" checked={confirmedClearance} onChange={(e) => setConfirmedClearance(e.target.checked)} className="mt-1 h-4 w-4 rounded border-[#D9D9D9] text-[#087E8B] focus:ring-[#087E8B] focus:ring-offset-0 cursor-pointer" aria-required="true" aria-invalid={!!errors.confirmedClearance} />
                  <Label htmlFor="confirmedClearance" className="text-sm text-[#1E1E1E] cursor-pointer">
                    I understand that where my trainer determines medical clearance is required, no training sessions will commence until that clearance has been received in writing. I agree to cooperate with requests for medical clearance and to inform my trainer of any change to my health status before my next session. <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                </div>
                {errors.confirmedClearance && <p className="text-red-600 text-xs mt-1 ml-7" role="alert">{errors.confirmedClearance}</p>}

                <div className="flex items-start gap-3">
                  <input type="checkbox" id="consentGpContact" checked={consentGpContact} onChange={(e) => setConsentGpContact(e.target.checked)} className="mt-1 h-4 w-4 rounded border-[#D9D9D9] text-[#087E8B] focus:ring-[#087E8B] focus:ring-offset-0 cursor-pointer" aria-required="true" aria-invalid={!!errors.consentGpContact} />
                  <Label htmlFor="consentGpContact" className="text-sm text-[#1E1E1E] cursor-pointer">
                    I consent to my trainer contacting my GP for the purpose of requesting medical clearance where this is deemed necessary for my safety, and I understand my trainer will inform me before doing so. <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                </div>
                {errors.consentGpContact && <p className="text-red-600 text-xs mt-1 ml-7" role="alert">{errors.consentGpContact}</p>}
              </div>

              {/* Client signature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <Label htmlFor="clientNamePrint" className="text-[#1E1E1E] font-medium mb-2 block">
                    Client full name (print) <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                  <Input id="clientNamePrint" type="text" value={formData.clientNamePrint} onChange={(e) => handleChange("clientNamePrint", e.target.value)} className={inputClass("clientNamePrint")} required aria-required="true" />
                </div>
                <div>
                  <Label htmlFor="clientSignatureDate" className="text-[#1E1E1E] font-medium mb-2 block">
                    Date <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                  <Input id="clientSignatureDate" type="date" value={formData.clientSignatureDate} onChange={(e) => handleChange("clientSignatureDate", e.target.value)} className={inputClass("clientSignatureDate")} required aria-required="true" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[#1E1E1E] font-medium mb-2 block">
                    Client signature <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                  <SignaturePad
                    label="Client signature"
                    value={formData.clientSignature}
                    typedValue={formData.clientTypedSignature}
                    onChange={(val) => handleChange("clientSignature", val)}
                    onTypedChange={(val) => handleChange("clientTypedSignature", val)}
                    required
                    error={errors.clientSignature}
                  />
                </div>
              </div>

              {/* Trainer signature - auto-signed */}
              <div className="bg-[#F1F1F1] rounded-md p-4 mb-8">
                <p className="text-sm text-[#525A61] mb-3">
                  Trainer signature is applied automatically by Esther Fair upon client submission.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#1E1E1E] font-medium text-sm">Trainer name (print)</Label>
                    <p className="text-sm text-[#1E1E1E] mt-1 font-medium">Esther Fair</p>
                  </div>
                  <div>
                    <Label className="text-[#1E1E1E] font-medium text-sm">Trainer signature</Label>
                    <p className="text-sm text-[#1E1E1E] mt-1 italic font-serif text-lg">Esther Fair</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-[#D9D9D9]">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#087E8B] text-white hover:bg-[#087E8B]/90 px-8 py-3 text-base font-semibold disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Sign and submit PAR-Q"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handlePrint} className="px-8 py-3">
                Print PAR-Q
              </Button>
            </div>

            {/* Section 8: Annual Review Record */}
            <section aria-labelledby="review-heading">
              <h2 id="review-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 8 — Annual Review Record
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                <p className="text-sm text-amber-900 font-semibold">This form must be reviewed every 12 months or following any change in health status.</p>
                <p className="text-sm text-amber-800 mt-1">You must inform your trainer immediately of any change to your health, new diagnosis, new medication, or any hospital admission. Do not wait until your next session.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" role="table" aria-label="Annual review record">
                  <thead>
                    <tr className="bg-[#087E8B] text-white">
                      <th className="text-left p-3 font-semibold" scope="col">Review date</th>
                      <th className="text-left p-3 font-semibold" scope="col">Changes to health, medications, or conditions</th>
                      <th className="text-left p-3 font-semibold" scope="col">Client signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3].map((i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F1F1F1]"}>
                        <td className="p-3 border-t border-[#D9D9D9] h-12">&nbsp;</td>
                        <td className="p-3 border-t border-[#D9D9D9]">&nbsp;</td>
                        <td className="p-3 border-t border-[#D9D9D9]">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </form>

          {/* Footer */}
          <footer className="border-t border-[#D9D9D9] px-6 py-4 text-center text-xs text-[#525A61] print:border-t-0">
            <p>
              Eternal <span className="text-[#C1839F]">♥</span> Fitness · PAR-Q / Medical Health Screening · Confidential — held securely on file
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
