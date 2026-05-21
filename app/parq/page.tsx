"use client";

import React, { useState, useRef } from "react";
import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
    return (
      <div className="min-h-screen bg-[#F1F1F1] py-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#087E8B] flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] mb-2">
            PAR-Q Form Submitted Successfully
          </h1>
          <p className="text-[#525A61] mb-6">
            Thank you, {formData.fullName}. Your health screening form has been completed and saved.
          </p>
          <p className="text-sm text-[#525A61] mb-6">
            This information is held securely on file. Esther will review your responses before your first session.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handlePrint} variant="secondary" className="bg-[#087E8B] text-white hover:bg-[#087E8B]/90">
              Print a copy
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
                {[
                  { q: "q1", text: "Has your doctor ever told you that you have a heart condition or cardiovascular disease?" },
                  { q: "q2", text: "Do you feel pain, pressure, tightness, or heaviness in your chest during physical activity?" },
                  { q: "q3", text: "Do you experience chest pain or discomfort at rest or when NOT exercising?" },
                  { q: "q4", text: "Do you ever feel dizzy, faint, or lose consciousness during or after exercise?" },
                  { q: "q5", text: "Do you experience unexplained shortness of breath at rest or with minimal exertion?" },
                  { q: "q6", text: "Do you experience palpitations, irregular heartbeat, or a racing heart?" },
                  { q: "q7", text: "Do you have high blood pressure or are you being treated for it?" },
                  { q: "q8", text: "Do you have high cholesterol or are you being treated for it?" },
                  { q: "q9", text: "Have you had a stroke or TIA (transient ischaemic attack)?" },
                  { q: "q10", text: "Do you have diabetes (Type 1 or Type 2)?", note: "If yes, please give full details in Section 5." },
                  { q: "q11", text: "Do you smoke or have you smoked in the last 5 years?" },
                ].map(({ q, text, note }) => (
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
                {[
                  { q: "q12", text: "Do you have any bone, joint, or muscle condition that could be affected by exercise?", note: "E.g. arthritis, osteoporosis, previous fractures, joint replacements." },
                  { q: "q13", text: "Have you had any surgery in the last 5 years?", note: "If yes, please give details including dates in Section 5." },
                  { q: "q14", text: "Do you have any implanted medical devices?", note: "E.g. pacemaker, defibrillator, neurostimulator, cochlear implant, spinal shunt, lumbar peritoneal shunt, VP shunt, insulin pump, or any other surgically implanted device. Please give full details in Section 5." },
                  { q: "q15", text: "Have you ever had a spinal injury, spinal surgery, or been told to avoid spinal loading or high-impact activity?", note: "If yes, give full details in Section 5 including any restrictions given by your consultant." },
                  { q: "q16", text: "Do you have any neurological condition?", note: "E.g. epilepsy, multiple sclerosis, Parkinson's disease, or any condition affecting balance, coordination, or sensation." },
                  { q: "q17", text: "Do you experience chronic pain that affects your ability to exercise?" },
                  { q: "q18", text: "Do you have any condition affecting your vision, hearing, or other senses that your trainer should be aware of?", note: "If yes, please give full details in Section 5." },
                ].map(({ q, text, note }) => (
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
                {[
                  { q: "q19", text: "Are you taking any blood-thinning medication (anticoagulants)?", note: "E.g. Warfarin, Apixaban, Rivaroxaban, Dabigatran, Clopidogrel, prescribed Aspirin. If yes — this significantly affects your risk of bruising and bleeding from falls or impacts. Your trainer must know." },
                  { q: "q20", text: "Do you have any blood disorder or condition affecting your blood?", note: "E.g. polycythaemia rubra vera, haemophilia, anaemia, thrombocytopenia, leukaemia, sickle cell. If yes, give full details in Section 5." },
                  { q: "q21", text: "Are you receiving any injection-based medication on a regular basis?", note: "E.g. insulin, Peg Interferon, biological therapy, B12. If yes, specify in Section 5 — some injection medications cause significant fatigue on injection day." },
                  { q: "q22", text: "Are you taking any statin medication?", note: "E.g. Simvastatin, Atorvastatin, Rosuvastatin. Statins can cause muscle pain (myopathy). Please inform your trainer of any unusual muscle pain during or after sessions." },
                  { q: "q23", text: "Are you taking any other prescription medication not listed above?", note: "If yes, list all medications in Section 5 including dosage and what they are prescribed for." },
                  { q: "q24", text: "Do you have any diagnosed medical condition not already disclosed above?", note: "If yes, give full details in Section 5." },
                  { q: "q25", text: "Have you been advised by any doctor, consultant, or medical professional to avoid or restrict certain types of exercise?", note: "If yes, describe the restrictions exactly and state who gave them in Section 5. Verbal restrictions are equally important to document." },
                  { q: "q26", text: "Have you had any major illness, hospital admission, or operation in the last 5 years?", note: "If yes, give details in Section 5 including dates and treating hospital or consultant." },
                ].map(({ q, text, note }) => (
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
                  {[
                    { q: "q27", text: "Are you currently pregnant or have you given birth in the last 6 months?" },
                    { q: "q28", text: "Do you have any dietary restrictions, allergies, or eating disorder history your trainer should be aware of?", note: "Your trainer will treat all disclosures in confidence." },
                    { q: "q29", text: "Do you have any other reason — physical, medical, or personal — why you feel you may not be able to participate safely in an exercise programme?" },
                  ].map(({ q, text, note }) => (
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
