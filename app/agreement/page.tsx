"use client";

import React, { useState, useRef } from "react";
import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormData {
  clientName: string;
  clientDob: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  trainerName: string;
  businessName: string;
  startDate: string;
  clientNamePrint: string;
  clientSignatureDate: string;
  clientSignature: string;
  clientTypedSignature: string;
  parqCompleted: "yes" | "no" | "";
  parqDate: string;
  parqFiledBy: string;
  medicalClearance: "yes" | "na" | "";
  medicalClearanceDate: string;
  medicalClearanceFrom: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const initialFormData: FormData = {
  clientName: "",
  clientDob: "",
  clientAddress: "",
  clientEmail: "",
  clientPhone: "",
  trainerName: "Esther Fair",
  businessName: "Eternal Fitness",
  startDate: "",
  clientNamePrint: "",
  clientSignatureDate: "",
  clientSignature: "",
  clientTypedSignature: "",
  parqCompleted: "",
  parqDate: "",
  parqFiledBy: "",
  medicalClearance: "",
  medicalClearanceDate: "",
  medicalClearanceFrom: "",
};

export default function AgreementPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof FormData, value: string) => {
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
    const newErrors: ValidationErrors = {};

    const requiredFields: (keyof FormData)[] = [
      "clientName",
      "clientDob",
      "clientAddress",
      "clientEmail",
      "clientPhone",
      "startDate",
      "clientNamePrint",
      "clientSignatureDate",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = "This field is required";
      }
    });

    const hasClientSignature = formData.clientSignature || formData.clientTypedSignature;
    if (!hasClientSignature) {
      newErrors.clientSignature = "A signature is required";
    }

    if (formData.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = "Please enter a valid email address";
    }

    if (!agreedToTerms) {
      newErrors.agreedToTerms = "You must confirm that you have read and agree to the terms";
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
      const response = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          trainerNamePrint: "Esther Fair",
          trainerSignatureDate: new Date().toISOString().split("T")[0],
          trainerTypedSignature: "Esther Fair",
          agreedToTerms,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save agreement");
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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F1F1F1] py-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#087E8B] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] mb-2">
            Agreement Signed Successfully
          </h1>
          <p className="text-[#525A61] mb-6">
            Thank you, {formData.clientName}. Your personal training agreement has been completed and saved.
          </p>
          <p className="text-sm text-[#525A61] mb-6">
            A copy of this agreement is held securely on file. You can request access to your data at any time.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handlePrint}
              variant="secondary"
              className="bg-[#087E8B] text-white hover:bg-[#087E8B]/90"
            >
              Print a copy
            </Button>
            <Button
              onClick={() => {
                setIsSubmitted(false);
                setFormData(initialFormData);
                setAgreedToTerms(false);
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
          ref={agreementRef}
          className="bg-white rounded-lg shadow-md print:shadow-none print:rounded-none"
          role="document"
          aria-label="Personal Training Agreement"
        >
          {/* Header */}
          <header className="border-b-4 border-[#087E8B] px-6 pt-8 pb-6 print:pb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">
              Eternal <span className="text-[#C1839F]">♥</span> Fitness
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-[#087E8B] mt-2">
              Personal Training Agreement
            </h2>
            <p className="text-[#525A61] mt-2 text-sm italic" role="note">
              Please read carefully before signing
            </p>
            <p className="text-[#1E1E1E] mt-4 text-sm leading-relaxed">
              This agreement is between Eternal Fitness (the Trainer) and the client named below. By signing you confirm that you have read, understood, and agreed to all terms.
            </p>
          </header>

          <form onSubmit={handleSubmit} noValidate className="px-6 py-6 space-y-8">
            {/* Submit error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
                <p className="text-red-800 text-sm font-semibold">Error saving agreement</p>
                <p className="text-red-700 text-sm mt-1">{submitError}</p>
              </div>
            )}

            {/* Error summary */}
            {Object.keys(errors).length > 0 && (
              <div
                className="bg-red-50 border border-red-200 rounded-md p-4"
                role="alert"
                aria-labelledby="error-summary-heading"
              >
                <h3 id="error-summary-heading" className="text-red-800 font-semibold text-sm mb-2">
                  Please correct the following errors:
                </h3>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>
                      <a
                        href={`#field-${field}`}
                        className="underline hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                      >
                        {message}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section A: Parties */}
            <section aria-labelledby="parties-heading">
              <h2 id="parties-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                A. Parties to this agreement
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2" data-error-first>
                  <Label htmlFor="clientName" className="text-[#1E1E1E] font-medium">
                    Client full name <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="clientName"
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => handleChange("clientName", e.target.value)}
                    className={inputClass("clientName")}
                    required
                    aria-required="true"
                    aria-invalid={!!errors.clientName}
                    aria-describedby={errors.clientName ? "clientName-error" : undefined}
                  />
                  {errors.clientName && (
                    <p id="clientName-error" className="text-red-600 text-xs mt-1" role="alert">
                      {errors.clientName}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="clientDob" className="text-[#1E1E1E] font-medium">
                    Client date of birth <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="clientDob"
                    type="date"
                    value={formData.clientDob}
                    onChange={(e) => handleChange("clientDob", e.target.value)}
                    className={inputClass("clientDob")}
                    required
                    aria-required="true"
                    aria-invalid={!!errors.clientDob}
                  />
                </div>

                <div>
                  <Label htmlFor="startDate" className="text-[#1E1E1E] font-medium">
                    Agreement start date <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className={inputClass("startDate")}
                    required
                    aria-required="true"
                    aria-invalid={!!errors.startDate}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="clientAddress" className="text-[#1E1E1E] font-medium">
                    Client address <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="clientAddress"
                    type="text"
                    value={formData.clientAddress}
                    onChange={(e) => handleChange("clientAddress", e.target.value)}
                    className={inputClass("clientAddress")}
                    required
                    aria-required="true"
                    aria-invalid={!!errors.clientAddress}
                  />
                </div>

                <div>
                  <Label htmlFor="clientEmail" className="text-[#1E1E1E] font-medium">
                    Client email <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleChange("clientEmail", e.target.value)}
                    className={inputClass("clientEmail")}
                    required
                    aria-required="true"
                    aria-invalid={!!errors.clientEmail}
                  />
                  {errors.clientEmail && (
                    <p className="text-red-600 text-xs mt-1" role="alert">
                      {errors.clientEmail}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="clientPhone" className="text-[#1E1E1E] font-medium">
                    Client phone <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => handleChange("clientPhone", e.target.value)}
                    className={inputClass("clientPhone")}
                    required
                    aria-required="true"
                    aria-invalid={!!errors.clientPhone}
                  />
                </div>

                <div>
                  <Label htmlFor="trainerName" className="text-[#1E1E1E] font-medium">
                    Trainer name
                  </Label>
                  <Input
                    id="trainerName"
                    type="text"
                    value={formData.trainerName}
                    className={inputClass("trainerName")}
                    readOnly
                    aria-readonly="true"
                  />
                </div>

                <div>
                  <Label htmlFor="businessName" className="text-[#1E1E1E] font-medium">
                    Business name
                  </Label>
                  <Input
                    id="businessName"
                    type="text"
                    value={formData.businessName}
                    className={inputClass("businessName")}
                    readOnly
                    aria-readonly="true"
                  />
                </div>
              </div>
            </section>

            {/* Section 1: Trainer's commitments */}
            <section aria-labelledby="trainer-commitments-heading">
              <h2 id="trainer-commitments-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                1. The trainer&apos;s commitments to you
              </h2>

              <div className="space-y-4 text-sm leading-relaxed text-[#1E1E1E]">
                <div>
                  <h3 className="font-semibold text-[#087E8B]">1.1 Professional standards</h3>
                  <p className="mt-1">
                    The trainer will deliver all sessions professionally, in accordance with their qualifications, current industry guidelines, and within their scope of practice.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">1.2 Insurance</h3>
                  <p className="mt-1">
                    The trainer will maintain current, valid professional liability insurance throughout the duration of this agreement. Sessions will only be delivered whilst valid insurance is in place. The client will be notified of any change to the trainer&apos;s insurance status.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">1.3 Programme design</h3>
                  <p className="mt-1">
                    The trainer will design a programme based on the client&apos;s stated goals, health screening information, and assessment results, reviewed and updated regularly in response to progress and any changes to health or circumstances.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">1.4 Confidentiality</h3>
                  <p className="mt-1">
                    All personal, medical, and training information will be held in strict confidence and stored securely in accordance with UK data protection legislation (UK GDPR / Data Protection Act 2018). Information will not be shared with third parties without the client&apos;s written consent, except where required by law or to protect the client&apos;s safety.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">1.5 Referral</h3>
                  <p className="mt-1">
                    The trainer will work within their scope of practice at all times. Where medical or specialist referral is required, this will be recommended promptly. Where a condition requires medical clearance before exercise, no sessions will commence or continue until that clearance has been received in writing.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">1.6 Cancellation by the trainer</h3>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Sessions cancelled by the trainer with less than 24 hours notice will be rescheduled at no cost or credited to the client&apos;s account.</li>
                    <li>If the trainer is late to start a session, the full session duration will be delivered or the shortfall credited.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2: Client's responsibilities */}
            <section aria-labelledby="client-responsibilities-heading">
              <h2 id="client-responsibilities-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                2. The client&apos;s responsibilities
              </h2>

              <div className="space-y-4 text-sm leading-relaxed text-[#1E1E1E]">
                <div>
                  <h3 className="font-semibold text-[#087E8B]">2.1 Health disclosure</h3>
                  <p className="mt-1">
                    The client agrees to disclose all relevant health information on the PAR-Q before their first session, including all medical conditions, diagnosed conditions, injuries, implanted medical devices, and all prescription medications.
                  </p>
                  <p className="mt-2">
                    The client agrees to update the trainer immediately — before their next session — if any of the following occur:
                  </p>
                  <ul className="mt-1 list-disc list-inside space-y-1 ml-2">
                    <li>A new medical diagnosis is received</li>
                    <li>A new medication is prescribed or an existing medication is changed or stopped</li>
                    <li>A hospital admission or surgical procedure takes place</li>
                    <li>A medical professional gives new exercise restrictions or advice</li>
                    <li>Any implanted medical device is fitted, adjusted, or removed</li>
                    <li>Any significant change in physical or mental health occurs</li>
                  </ul>
                  <p className="mt-2 text-[#525A61] italic">
                    Withholding or providing inaccurate health information may put the client&apos;s safety at risk. Where a client fails to disclose relevant health information and this contributes to injury or adverse outcome, responsibility rests with the client.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">2.2 Medical clearance</h3>
                  <p className="mt-1">
                    Where the trainer determines that medical clearance is required, the client agrees to seek that clearance from their GP or relevant specialist. No sessions will be delivered until clearance has been received in writing by the trainer. Verbal clearance is not sufficient.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">2.3 Conduct during sessions</h3>
                  <p className="mt-1">
                    The client agrees to inform the trainer immediately if they experience any pain, dizziness, chest discomfort, nausea, or any unusual symptom during a session, and to follow the trainer&apos;s safety instructions at all times.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">2.4 Cancellation by the client</h3>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Sessions must be cancelled or rescheduled with at least 24 hours notice. Sessions cancelled with less than 24 hours notice will be forfeited.</li>
                    <li>If the client is late to a session, the session will end at the scheduled time unless alternative arrangements have been agreed in advance.</li>
                    <li>All sessions are 60 minutes unless otherwise agreed in writing.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">2.5 Independent training</h3>
                  <p className="mt-1">
                    Where the trainer provides a home exercise programme, the client is responsible for their own safety during independent training and agrees to inform the trainer of any difficulties, pain, or concerns.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Medical clearance requirements */}
            <section aria-labelledby="medical-clearance-heading">
              <h2 id="medical-clearance-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                3. Medical clearance requirements
              </h2>
              <p className="text-sm text-[#525A61] mb-4 italic">
                Conditions requiring written GP or specialist clearance before sessions begin
              </p>
              <p className="text-sm text-[#1E1E1E] mb-4">
                The following conditions automatically require written medical clearance before any sessions are delivered. This list is not exhaustive — the trainer reserves the right to request clearance for any condition deemed relevant to the client&apos;s safety. Verbal clearance is not sufficient.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" role="table" aria-label="Medical clearance requirements">
                  <thead>
                    <tr className="bg-[#087E8B] text-white">
                      <th className="text-left p-3 font-semibold" scope="col">Condition or medication</th>
                      <th className="text-left p-3 font-semibold" scope="col">Clearance required from</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Any implanted medical device (pacemaker, shunt, neurostimulator, insulin pump, defibrillator)", "Neurosurgeon or implanting specialist"],
                      ["Anticoagulant medication (Warfarin, Apixaban, Rivaroxaban, Dabigatran, Clopidogrel)", "GP or haematologist"],
                      ["Blood disorder (polycythaemia rubra vera, haemophilia, thrombocytopenia, leukaemia)", "Haematologist"],
                      ["Significant cardiac condition (heart attack, heart failure, arrhythmia, valve disease)", "Cardiologist or GP"],
                      ["Uncontrolled hypertension (systolic above 180 or diastolic above 110)", "GP"],
                      ["Neurological condition affecting balance, coordination, or sensation", "Neurologist or GP"],
                      ["Recent surgery within 12 weeks", "Surgeon or GP"],
                      ["Active cancer or cancer treatment", "Oncologist or GP"],
                      ["Type 1 diabetes", "GP or endocrinologist"],
                      ["Epilepsy not fully controlled by medication", "Neurologist or GP"],
                      ["Any condition where a medical professional has given specific exercise restrictions", "GP or relevant specialist"],
                      ["Significant respiratory condition (COPD, severe asthma, pulmonary fibrosis)", "GP or respiratory specialist"],
                    ].map(([condition, clearance], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F1F1F1]"}>
                        <td className="p-3 border-t border-[#D9D9D9]">{condition}</td>
                        <td className="p-3 border-t border-[#D9D9D9]">{clearance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 4: Payment terms */}
            <section aria-labelledby="payment-heading">
              <h2 id="payment-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                4. Payment terms
              </h2>

              <div className="space-y-4 text-sm leading-relaxed text-[#1E1E1E]">
                <div>
                  <h3 className="font-semibold text-[#087E8B]">4.1 Session packages</h3>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>A block of 12 personal training sessions is valid for 120 days from the date of purchase.</li>
                    <li>A block of 24 personal training sessions is valid for 240 days from the date of purchase.</li>
                    <li>Sessions not used within the validity period are forfeited without refund.</li>
                    <li>Full payment is required before the block commences. No sessions will be delivered without prior payment.</li>
                    <li>A non-refundable deposit of £100 is required to secure time slots, deductible from the total cost of the first block.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">4.2 Rolling monthly contracts</h3>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Rolling contracts are subject to a minimum initial term of 3 months (12 weeks).</li>
                    <li>Cancellation within the initial 3-month term will result in the client remaining liable for the full cost of sessions in the remaining term.</li>
                    <li>After the initial 3-month term, one calendar month&apos;s written notice is required to cancel.</li>
                    <li>Monthly payments are due every 4 weeks and must be set up in advance. No sessions will be delivered if payment is outstanding.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">4.3 Refunds</h3>
                  <p className="mt-1">
                    No refunds will be issued for unused sessions for any reason, including relocation, illness, change of circumstances, or voluntary withdrawal from the programme.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">4.4 Medical suspension</h3>
                  <p className="mt-1">
                    Where a client is unable to train due to a medical condition or injury, sessions may be suspended at the trainer&apos;s discretion. Suspended sessions will be held on account and used once the client has received appropriate medical clearance to resume. Sessions will not be refunded but may be rescheduled within a timeframe agreed between both parties.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Risk, liability, and safety */}
            <section aria-labelledby="risk-heading">
              <h2 id="risk-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                5. Risk, liability, and safety
              </h2>

              <div className="space-y-4 text-sm leading-relaxed text-[#1E1E1E]">
                <div>
                  <h3 className="font-semibold text-[#087E8B]">5.1 Inherent risks of exercise</h3>
                  <p className="mt-1">
                    The client acknowledges that physical exercise carries inherent risks including musculoskeletal injury, cardiovascular events, falls, and exacerbation of existing medical conditions. The trainer will take all reasonable steps to minimise these risks through appropriate programme design and professional supervision.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">5.2 Client responsibility for disclosed information</h3>
                  <p className="mt-1">
                    The trainer&apos;s ability to ensure the client&apos;s safety depends entirely on the accuracy and completeness of information disclosed. Where a client fails to disclose relevant health information and this contributes to injury or adverse outcome, responsibility rests with the client.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">5.3 Scope of practice</h3>
                  <p className="mt-1">
                    The trainer is a qualified fitness professional and is not a medical professional, physiotherapist, dietitian, or mental health practitioner. Nothing provided constitutes medical advice, diagnosis, or treatment.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">5.4 Trainer liability</h3>
                  <p className="mt-1">
                    The trainer&apos;s liability is limited to direct loss caused by the trainer&apos;s negligence in delivering sessions. The trainer accepts no liability for:
                  </p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Injury resulting from the client&apos;s failure to disclose relevant health information</li>
                    <li>Injury sustained during independent training outside of supervised sessions</li>
                    <li>Loss of earnings, indirect losses, or consequential losses of any kind</li>
                    <li>Pre-existing conditions aggravated by exercise where the trainer was not informed</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">5.5 Emergency protocol</h3>
                  <p className="mt-1">
                    In the event of a medical emergency during a session, the trainer will call emergency services (999) immediately and administer first aid in accordance with their qualifications. The client consents to emergency services being called on their behalf in the event of a medical emergency.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6: Data protection */}
            <section aria-labelledby="data-heading">
              <h2 id="data-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                6. Data protection and privacy
              </h2>

              <div className="space-y-4 text-sm leading-relaxed text-[#1E1E1E]">
                <div>
                  <h3 className="font-semibold text-[#087E8B]">6.1 Data held</h3>
                  <p className="mt-1">
                    The trainer holds: name, contact details, date of birth, health screening information, medical clearance letters, session records, and payment records.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">6.2 Purpose and retention</h3>
                  <p className="mt-1">
                    This information is used solely for the purpose of delivering personal training services safely and professionally. Client records will be retained for a minimum of 7 years following the end of the training relationship, then securely destroyed.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">6.3 Access</h3>
                  <p className="mt-1">
                    The client has the right to request access to their personal data at any time. Requests should be made in writing and will be responded to within 30 days.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7: General terms */}
            <section aria-labelledby="general-heading">
              <h2 id="general-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                7. General terms
              </h2>

              <div className="space-y-4 text-sm leading-relaxed text-[#1E1E1E]">
                <div>
                  <h3 className="font-semibold text-[#087E8B]">7.1 Entire agreement</h3>
                  <p className="mt-1">
                    This agreement, together with the completed PAR-Q, constitutes the entire agreement between the trainer and the client and supersedes all previous agreements, verbal or written.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">7.2 Amendments</h3>
                  <p className="mt-1">
                    Any changes to this agreement must be agreed and signed in writing by both parties before taking effect.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">7.3 Governing law</h3>
                  <p className="mt-1">
                    This agreement is governed by the laws of England and Wales.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#087E8B]">7.4 Communication</h3>
                  <p className="mt-1">
                    Formal notices must be sent by email to the addresses above. Day-to-day communication may be by text or messaging platforms as agreed between both parties.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8: Signatures */}
            <section aria-labelledby="signatures-heading">
              <h2 id="signatures-heading" className="text-lg font-bold text-[#1E1E1E] mb-4 pb-2 border-b border-[#D9D9D9]">
                8. Agreement and signatures
              </h2>

              <div className="bg-[#F1F1F1] rounded-md p-4 mb-6">
                <p className="text-sm text-[#1E1E1E] mb-3">
                  By signing below, both parties confirm that they have read and understood this agreement in full. The client confirms that they have completed the PAR-Q honestly and accept all terms set out in this agreement.
                </p>
                <p className="text-sm font-semibold text-[#1E1E1E] mb-2">The client confirms specifically that:</p>
                <ul className="text-sm list-disc list-inside space-y-1 text-[#1E1E1E]">
                  <li>They have disclosed all relevant medical conditions, medications, and health information on the PAR-Q</li>
                  <li>They understand that medical clearance may be required before sessions begin and that sessions will not commence until that clearance is received in writing</li>
                  <li>They will inform the trainer immediately of any change to their health, medication, or medical advice before their next session</li>
                  <li>They understand the risks of exercise as described in Section 5 and accept personal responsibility for health information they choose not to disclose</li>
                  <li>They have not been told by any medical professional that they must not exercise — or if they have, they have disclosed this to the trainer before signing</li>
                </ul>
              </div>

              {/* Agreement confirmation */}
              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreedToTerms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#D9D9D9] text-rose focus:ring-rose focus:ring-offset-0 cursor-pointer"
                    aria-required="true"
                    aria-invalid={!!errors.agreedToTerms}
                  />
                  <Label htmlFor="agreedToTerms" className="text-sm text-[#1E1E1E] cursor-pointer">
                    I confirm that I have read and understood this agreement in full, and I accept all terms set out above. <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                </div>
                {errors.agreedToTerms && (
                  <p className="text-red-600 text-xs mt-1 ml-7" role="alert">
                    {errors.agreedToTerms}
                  </p>
                )}
              </div>

              {/* Client signature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <Label htmlFor="clientNamePrint" className="text-[#1E1E1E] font-medium mb-2 block">
                    Client full name (print) <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="clientNamePrint"
                    type="text"
                    value={formData.clientNamePrint}
                    onChange={(e) => handleChange("clientNamePrint", e.target.value)}
                    className={inputClass("clientNamePrint")}
                    required
                    aria-required="true"
                    aria-invalid={!!errors.clientNamePrint}
                  />
                </div>
                <div>
                  <Label htmlFor="clientSignatureDate" className="text-[#1E1E1E] font-medium mb-2 block">
                    Date <span className="text-red-600" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="clientSignatureDate"
                    type="date"
                    value={formData.clientSignatureDate}
                    onChange={(e) => handleChange("clientSignatureDate", e.target.value)}
                    className={inputClass("clientSignatureDate")}
                    required
                    aria-required="true"
                    aria-invalid={!!errors.clientSignatureDate}
                  />
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

              {/* PAR-Q and Medical clearance filing */}
              <div className="bg-[#F1F1F1] rounded-md p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[#1E1E1E] font-medium mb-2 block">PAR-Q completed and filed</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="parqCompleted"
                          value="yes"
                          checked={formData.parqCompleted === "yes"}
                          onChange={() => handleChange("parqCompleted", "yes")}
                          className="h-4 w-4 text-rose focus:ring-rose"
                        />
                        YES
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="parqCompleted"
                          value="no"
                          checked={formData.parqCompleted === "no"}
                          onChange={() => handleChange("parqCompleted", "no")}
                          className="h-4 w-4 text-rose focus:ring-rose"
                        />
                        NO
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="parqDate" className="text-[#1E1E1E] font-medium mb-2 block">Date</Label>
                    <Input
                      id="parqDate"
                      type="date"
                      value={formData.parqDate}
                      onChange={(e) => handleChange("parqDate", e.target.value)}
                      className={inputClass("parqDate")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parqFiledBy" className="text-[#1E1E1E] font-medium mb-2 block">Filed by</Label>
                    <Input
                      id="parqFiledBy"
                      type="text"
                      value={formData.parqFiledBy}
                      onChange={(e) => handleChange("parqFiledBy", e.target.value)}
                      className={inputClass("parqFiledBy")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[#1E1E1E] font-medium mb-2 block">Medical clearance received and filed (if required)</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="medicalClearance"
                          value="yes"
                          checked={formData.medicalClearance === "yes"}
                          onChange={() => handleChange("medicalClearance", "yes")}
                          className="h-4 w-4 text-rose focus:ring-rose"
                        />
                        YES
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="medicalClearance"
                          value="na"
                          checked={formData.medicalClearance === "na"}
                          onChange={() => handleChange("medicalClearance", "na")}
                          className="h-4 w-4 text-rose focus:ring-rose"
                        />
                        N/A
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="medicalClearanceDate" className="text-[#1E1E1E] font-medium mb-2 block">Date</Label>
                    <Input
                      id="medicalClearanceDate"
                      type="date"
                      value={formData.medicalClearanceDate}
                      onChange={(e) => handleChange("medicalClearanceDate", e.target.value)}
                      className={inputClass("medicalClearanceDate")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="medicalClearanceFrom" className="text-[#1E1E1E] font-medium mb-2 block">From</Label>
                    <Input
                      id="medicalClearanceFrom"
                      type="text"
                      value={formData.medicalClearanceFrom}
                      onChange={(e) => handleChange("medicalClearanceFrom", e.target.value)}
                      className={inputClass("medicalClearanceFrom")}
                    />
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
                  "Sign and submit agreement"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                className="px-8 py-3"
              >
                Print agreement
              </Button>
            </div>
          </form>

          {/* Footer */}
          <footer className="border-t border-[#D9D9D9] px-6 py-4 text-center text-xs text-[#525A61] print:border-t-0">
            <p>
              Eternal <span className="text-[#C1839F]">♥</span> Fitness · Personal Training Agreement · Review annually or following any change in health · Confidential — held securely on file
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
