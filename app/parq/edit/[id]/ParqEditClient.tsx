"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ParqData {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  gp_name: string | null;
  gp_surgery: string | null;
  gp_phone: string | null;
  q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; q7: string; q8: string; q9: string; q10: string; q11: string;
  q12: string; q13: string; q14: string; q15: string; q16: string; q17: string; q18: string;
  q19: string; q20: string; q21: string; q22: string; q23: string; q24: string; q25: string; q26: string;
  q27: string; q28: string; q29: string;
  conditions: string | null;
  medications: string | null;
  devices: string | null;
  exercise_restrictions: string | null;
  surgeries: string | null;
  other_info: string | null;
  current_exercise: string | null;
  training_goals: string | null;
  client_name_print: string | null;
  client_signature_date: string | null;
  client_signature_data: string | null;
  client_typed_signature: string | null;
}

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
  clientTypedSignature: string;
}

function toFormData(parq: ParqData): ParqFormData {
  return {
    fullName: parq.full_name || "",
    dateOfBirth: parq.date_of_birth || "",
    address: parq.address || "",
    email: parq.email || "",
    phone: parq.phone || "",
    emergencyContactName: parq.emergency_contact_name || "",
    emergencyContactPhone: parq.emergency_contact_phone || "",
    gpName: parq.gp_name || "",
    gpSurgery: parq.gp_surgery || "",
    gpPhone: parq.gp_phone || "",
    q1: parq.q1 as ParqFormData["q1"], q2: parq.q2 as ParqFormData["q2"], q3: parq.q3 as ParqFormData["q3"],
    q4: parq.q4 as ParqFormData["q4"], q5: parq.q5 as ParqFormData["q5"], q6: parq.q6 as ParqFormData["q6"],
    q7: parq.q7 as ParqFormData["q7"], q8: parq.q8 as ParqFormData["q8"], q9: parq.q9 as ParqFormData["q9"],
    q10: parq.q10 as ParqFormData["q10"], q11: parq.q11 as ParqFormData["q11"],
    q12: parq.q12 as ParqFormData["q12"], q13: parq.q13 as ParqFormData["q13"], q14: parq.q14 as ParqFormData["q14"],
    q15: parq.q15 as ParqFormData["q15"], q16: parq.q16 as ParqFormData["q16"], q17: parq.q17 as ParqFormData["q17"],
    q18: parq.q18 as ParqFormData["q18"],
    q19: parq.q19 as ParqFormData["q19"], q20: parq.q20 as ParqFormData["q20"], q21: parq.q21 as ParqFormData["q21"],
    q22: parq.q22 as ParqFormData["q22"], q23: parq.q23 as ParqFormData["q23"], q24: parq.q24 as ParqFormData["q24"],
    q25: parq.q25 as ParqFormData["q25"], q26: parq.q26 as ParqFormData["q26"],
    conditions: parq.conditions || "",
    medications: parq.medications || "",
    devices: parq.devices || "",
    exerciseRestrictions: parq.exercise_restrictions || "",
    surgeries: parq.surgeries || "",
    otherInfo: parq.other_info || "",
    currentExercise: parq.current_exercise || "",
    trainingGoals: parq.training_goals || "",
    q27: parq.q27 as ParqFormData["q27"], q28: parq.q28 as ParqFormData["q28"], q29: parq.q29 as ParqFormData["q29"],
    clientNamePrint: parq.client_name_print || "",
    clientSignatureDate: parq.client_signature_date || "",
    clientTypedSignature: parq.client_typed_signature || "",
  };
}

const yesNoOptions: ("yes" | "no")[] = ["yes", "no"];

export default function ParqEditClient({ parq }: { parq: ParqData }) {
  const [formData, setFormData] = useState<ParqFormData>(toFormData(parq));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const requiredFields: (keyof ParqFormData)[] = [
      "fullName", "dateOfBirth", "address", "email", "phone",
      "emergencyContactName", "emergencyContactPhone",
      "gpName", "gpSurgery",
    ];
    requiredFields.forEach((field) => {
      if (!formData[field]) newErrors[field] = "This field is required";
    });

    const questions: (keyof ParqFormData)[] = [
      "q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11",
      "q12","q13","q14","q15","q16","q17","q18",
      "q19","q20","q21","q22","q23","q24","q25","q26",
      "q27","q28","q29",
    ];
    questions.forEach((q) => {
      if (!formData[q]) newErrors[q] = "Required";
    });

    if (!formData.clientNamePrint) newErrors.clientNamePrint = "Required";
    if (!formData.clientSignatureDate) newErrors.clientSignatureDate = "Required";
    if (!formData.clientTypedSignature) newErrors.clientTypedSignature = "Required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) {
      document.querySelector("[data-error-first]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/parq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parq.id,
          full_name: formData.fullName,
          date_of_birth: formData.dateOfBirth,
          address: formData.address,
          email: formData.email,
          phone: formData.phone,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContactPhone,
          gp_name: formData.gpName,
          gp_surgery: formData.gpSurgery,
          gp_phone: formData.gpPhone,
          q1: formData.q1, q2: formData.q2, q3: formData.q3, q4: formData.q4, q5: formData.q5,
          q6: formData.q6, q7: formData.q7, q8: formData.q8, q9: formData.q9, q10: formData.q10,
          q11: formData.q11, q12: formData.q12, q13: formData.q13, q14: formData.q14, q15: formData.q15,
          q16: formData.q16, q17: formData.q17, q18: formData.q18,
          q19: formData.q19, q20: formData.q20, q21: formData.q21, q22: formData.q22, q23: formData.q23,
          q24: formData.q24, q25: formData.q25, q26: formData.q26,
          q27: formData.q27, q28: formData.q28, q29: formData.q29,
          conditions: formData.conditions,
          medications: formData.medications,
          devices: formData.devices,
          exercise_restrictions: formData.exerciseRestrictions,
          surgeries: formData.surgeries,
          other_info: formData.otherInfo,
          current_exercise: formData.currentExercise,
          training_goals: formData.trainingGoals,
          client_name_print: formData.clientNamePrint,
          client_signature_date: formData.clientSignatureDate,
          client_typed_signature: formData.clientTypedSignature,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save");
      }

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    cn(
      "w-full rounded-md border border-[#D9D9D9] bg-white px-3 py-2 text-[#1E1E1E] text-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E8B] focus-visible:ring-offset-2",
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
      {errors[field] && <span className="text-red-600 text-xs" role="alert">{errors[field]}</span>}
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F1F1F1] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1E1E1E] mb-2">PAR-Q Updated</h2>
          <p className="text-[#525A61] text-sm">
            Your PAR-Q form has been updated successfully. Esther will review your changes before your next session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1]">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div ref={formRef} className="bg-white rounded-lg shadow-md">
          {/* Header */}
          <header className="border-b-4 border-[#087E8B] px-6 pt-8 pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">
              Eternal <span className="text-[#C1839F]">♥</span> Fitness
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-[#087E8B] mt-2">
              PAR-Q · Physical Activity Readiness Questionnaire
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4">
              <p className="text-sm text-amber-900 font-semibold">Update your PAR-Q</p>
              <p className="text-sm text-amber-800 mt-1">
                Please review your answers and complete any missing information. All fields marked with * are required.
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit} noValidate className="px-6 py-6 space-y-8">
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
                <p className="text-red-800 text-sm font-semibold">Error saving form</p>
                <p className="text-red-700 text-sm mt-1">{submitError}</p>
              </div>
            )}

            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
                <h3 className="text-red-800 font-semibold text-sm mb-2">Please correct the following errors:</h3>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>
                      <a href={`#field-${field}`} className="underline hover:text-red-900">{message}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section 1 */}
            <section>
              <h2 className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 1 — Personal Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2" data-error-first>
                  <Label htmlFor="fullName" className="text-[#1E1E1E] font-medium">Full name <span className="text-red-600">*</span></Label>
                  <Input id="fullName" type="text" value={formData.fullName} onChange={(e) => handleChange("fullName", e.target.value)} className={inputClass("fullName")} />
                  {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-[#1E1E1E] font-medium">Date of birth <span className="text-red-600">*</span></Label>
                  <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => handleChange("dateOfBirth", e.target.value)} className={inputClass("dateOfBirth")} />
                </div>
                <div>
                  <Label htmlFor="email" className="text-[#1E1E1E] font-medium">Email <span className="text-red-600">*</span></Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} className={inputClass("email")} />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address" className="text-[#1E1E1E] font-medium">Address <span className="text-red-600">*</span></Label>
                  <Input id="address" type="text" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} className={inputClass("address")} />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-[#1E1E1E] font-medium">Phone <span className="text-red-600">*</span></Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} className={inputClass("phone")} />
                </div>
                <div>
                  <Label htmlFor="emergencyContactName" className="text-[#1E1E1E] font-medium">Emergency contact <span className="text-red-600">*</span></Label>
                  <Input id="emergencyContactName" type="text" value={formData.emergencyContactName} onChange={(e) => handleChange("emergencyContactName", e.target.value)} className={inputClass("emergencyContactName")} />
                </div>
                <div>
                  <Label htmlFor="emergencyContactPhone" className="text-[#1E1E1E] font-medium">Emergency phone <span className="text-red-600">*</span></Label>
                  <Input id="emergencyContactPhone" type="tel" value={formData.emergencyContactPhone} onChange={(e) => handleChange("emergencyContactPhone", e.target.value)} className={inputClass("emergencyContactPhone")} />
                </div>
                <div>
                  <Label htmlFor="gpName" className="text-[#1E1E1E] font-medium">GP name <span className="text-red-600">*</span></Label>
                  <Input id="gpName" type="text" value={formData.gpName} onChange={(e) => handleChange("gpName", e.target.value)} className={inputClass("gpName")} />
                </div>
                <div>
                  <Label htmlFor="gpSurgery" className="text-[#1E1E1E] font-medium">GP surgery <span className="text-red-600">*</span></Label>
                  <Input id="gpSurgery" type="text" value={formData.gpSurgery} onChange={(e) => handleChange("gpSurgery", e.target.value)} className={inputClass("gpSurgery")} />
                </div>
                <div>
                  <Label htmlFor="gpPhone" className="text-[#1E1E1E] font-medium">GP phone</Label>
                  <Input id="gpPhone" type="tel" value={formData.gpPhone} onChange={(e) => handleChange("gpPhone", e.target.value)} className={inputClass("gpPhone")} />
                </div>
              </div>
            </section>

            {/* Sections 2-4, 6: Yes/No */}
            {[
              { label: "Section 2 — Cardiovascular and General Health", qs: [
                { q: "q1", t: "Heart condition or cardiovascular disease" },
                { q: "q2", t: "Chest pain/pressure during activity" },
                { q: "q3", t: "Chest pain at rest" },
                { q: "q4", t: "Dizzy, faint, or lose consciousness" },
                { q: "q5", t: "Unexplained shortness of breath" },
                { q: "q6", t: "High cholesterol or treated" },
                { q: "q7", t: "Palpitations or irregular heartbeat" },
                { q: "q8", t: "High blood pressure or treated" },
                { q: "q9", t: "Stroke or TIA" },
                { q: "q10", t: "Diabetes" },
                { q: "q11", t: "Smoke or smoked in last 5 years" },
              ]},
              { label: "Section 3 — Musculoskeletal, Neurological, Surgical", qs: [
                { q: "q12", t: "Bone, joint, or muscle condition" },
                { q: "q13", t: "Surgery in last 5 years" },
                { q: "q14", t: "Implanted medical devices" },
                { q: "q15", t: "Spinal injury/surgery" },
                { q: "q16", t: "Neurological condition" },
                { q: "q17", t: "Chronic pain affecting exercise" },
                { q: "q18", t: "Vision, hearing, or other sense condition" },
              ]},
              { label: "Section 4 — Blood, Medications, Diagnosed Conditions", qs: [
                { q: "q19", t: "Blood-thinning medication" },
                { q: "q20", t: "Blood disorder" },
                { q: "q21", t: "Injection-based medication regularly" },
                { q: "q22", t: "Statin medication" },
                { q: "q23", t: "Other prescription medication" },
                { q: "q24", t: "Diagnosed condition not disclosed" },
                { q: "q25", t: "Advised to restrict exercise" },
                { q: "q26", t: "Major illness/hospital admission in last 5 years" },
              ]},
            ].map((section) => (
              <section key={section.label}>
                <h2 className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">{section.label}</h2>
                <div className="space-y-4">
                  {section.qs.map(({ q, t }) => (
                    <div key={q} className="bg-[#F1F1F1] rounded-md p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-[#1E1E1E] font-medium">{t}</p>
                        </div>
                        <YesNoGroup field={q as keyof ParqFormData} label={t} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Section 5 */}
            <section>
              <h2 className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 5 — Full Details
              </h2>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="conditions" className="text-[#1E1E1E] font-medium mb-2 block">Diagnosed medical conditions</Label>
                  <Textarea id="conditions" value={formData.conditions} onChange={(e) => handleChange("conditions", e.target.value)} className={textareaClass("conditions")} placeholder="E.g. Type 2 Diabetes — diagnosed March 2023" />
                </div>
                <div>
                  <Label htmlFor="medications" className="text-[#1E1E1E] font-medium mb-2 block">All current prescription medications</Label>
                  <Textarea id="medications" value={formData.medications} onChange={(e) => handleChange("medications", e.target.value)} className={textareaClass("medications")} placeholder="E.g. Metformin 500mg — twice daily" />
                </div>
                <div>
                  <Label htmlFor="devices" className="text-[#1E1E1E] font-medium mb-2 block">Implanted medical devices</Label>
                  <Textarea id="devices" value={formData.devices} onChange={(e) => handleChange("devices", e.target.value)} className={textareaClass("devices")} placeholder="E.g. None" />
                </div>
                <div>
                  <Label htmlFor="exerciseRestrictions" className="text-[#1E1E1E] font-medium mb-2 block">Exercise restrictions</Label>
                  <Textarea id="exerciseRestrictions" value={formData.exerciseRestrictions} onChange={(e) => handleChange("exerciseRestrictions", e.target.value)} className={textareaClass("exerciseRestrictions")} placeholder="E.g. Avoid heavy spinal loading" />
                </div>
                <div>
                  <Label htmlFor="surgeries" className="text-[#1E1E1E] font-medium mb-2 block">Surgeries (last 5 years)</Label>
                  <Textarea id="surgeries" value={formData.surgeries} onChange={(e) => handleChange("surgeries", e.target.value)} className={textareaClass("surgeries")} placeholder="E.g. June 2024 — Knee arthroscopy" />
                </div>
                <div>
                  <Label htmlFor="otherInfo" className="text-[#1E1E1E] font-medium mb-2 block">Any other information</Label>
                  <Textarea id="otherInfo" value={formData.otherInfo} onChange={(e) => handleChange("otherInfo", e.target.value)} className={textareaClass("otherInfo")} placeholder="E.g. None" />
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 6 — Lifestyle and Physical Activity
              </h2>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="currentExercise" className="text-[#1E1E1E] font-medium mb-2 block">Current exercise or sport</Label>
                  <Textarea id="currentExercise" value={formData.currentExercise} onChange={(e) => handleChange("currentExercise", e.target.value)} className={textareaClass("currentExercise")} placeholder="E.g. Walking 20 minutes daily" />
                </div>
                <div>
                  <Label htmlFor="trainingGoals" className="text-[#1E1E1E] font-medium mb-2 block">Training goals</Label>
                  <Textarea id="trainingGoals" value={formData.trainingGoals} onChange={(e) => handleChange("trainingGoals", e.target.value)} className={textareaClass("trainingGoals")} placeholder="E.g. Regain strength, improve mobility" />
                </div>
                {[
                  { q: "q27", t: "Pregnant or given birth in last 6 months" },
                  { q: "q28", t: "Dietary restrictions, allergies, or eating disorder" },
                  { q: "q29", t: "Other reason unable to participate safely" },
                ].map(({ q, t }) => (
                  <div key={q} className="bg-[#F1F1F1] rounded-md p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1"><p className="text-sm text-[#1E1E1E] font-medium">{t}</p></div>
                      <YesNoGroup field={q as keyof ParqFormData} label={t} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                Section 9 — Declaration and Signature
              </h2>
              <div className="bg-[#F1F1F1] rounded-md p-4 mb-6 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p className="text-sm text-[#1E1E1E]">I confirm that the information I have provided is accurate and complete to the best of my knowledge.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p className="text-sm text-[#1E1E1E]">I understand that where medical clearance is required, no training sessions will commence until that clearance has been received in writing.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="clientNamePrint" className="text-[#1E1E1E] font-medium">Client name (print) <span className="text-red-600">*</span></Label>
                  <Input id="clientNamePrint" type="text" value={formData.clientNamePrint} onChange={(e) => handleChange("clientNamePrint", e.target.value)} className={inputClass("clientNamePrint")} />
                  {errors.clientNamePrint && <p className="text-red-600 text-xs mt-1">{errors.clientNamePrint}</p>}
                </div>
                <div>
                  <Label htmlFor="clientSignatureDate" className="text-[#1E1E1E] font-medium">Date <span className="text-red-600">*</span></Label>
                  <Input id="clientSignatureDate" type="date" value={formData.clientSignatureDate} onChange={(e) => handleChange("clientSignatureDate", e.target.value)} className={inputClass("clientSignatureDate")} />
                  {errors.clientSignatureDate && <p className="text-red-600 text-xs mt-1">{errors.clientSignatureDate}</p>}
                </div>
                <div>
                  <Label htmlFor="clientTypedSignature" className="text-[#1E1E1E] font-medium">Type your full name as signature <span className="text-red-600">*</span></Label>
                  <Input id="clientTypedSignature" type="text" value={formData.clientTypedSignature} onChange={(e) => handleChange("clientTypedSignature", e.target.value)} className={inputClass("clientTypedSignature")} placeholder="Type your full name" />
                  {errors.clientTypedSignature && <p className="text-red-600 text-xs mt-1">{errors.clientTypedSignature}</p>}
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={isSubmitting} className="bg-[#087E8B] text-white hover:bg-[#087E8B]/90 px-8">
                {isSubmitting ? "Saving..." : "Update PAR-Q"}
              </Button>
            </div>
          </form>

          <footer className="border-t border-[#D9D9D9] px-6 py-4 text-center text-xs text-[#525A61]">
            <p>Eternal <span className="text-[#C1839F]">♥</span> Fitness · PAR-Q / Medical Health Screening · Confidential</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
