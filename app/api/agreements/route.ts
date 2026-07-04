import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { resolveClientId } from "@/lib/resolve-client-id";

export async function POST(request: Request) {
  const supabase = createClient();

  const body = await request.json();
  const {
    clientNumber,
    clientName,
    clientDob,
    clientAddress,
    clientEmail,
    clientPhone,
    trainerName,
    businessName,
    startDate,
    clientNamePrint,
    clientSignatureDate,
    clientSignature,
    clientTypedSignature,
    trainerNamePrint,
    trainerSignatureDate,
    trainerSignature,
    trainerTypedSignature,
    parqCompleted,
    parqDate,
    parqFiledBy,
    medicalClearance,
    medicalClearanceDate,
    medicalClearanceFrom,
    agreedToTerms,
  } = body;

  if (!clientName?.trim()) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  if (!agreedToTerms) {
    return NextResponse.json({ error: "Agreement terms must be accepted" }, { status: 400 });
  }

  const hasSignature = clientSignature || clientTypedSignature;
  if (!hasSignature) {
    return NextResponse.json({ error: "Client signature is required" }, { status: 400 });
  }

  const clientId = await resolveClientId(supabase, clientNumber);

  const { data, error } = await supabase
    .from("signed_agreements")
    .insert({
      ...(clientId ? { client_id: clientId } : {}),
      client_name: clientName.trim(),
      client_dob: clientDob || null,
      client_address: clientAddress || null,
      client_email: clientEmail || null,
      client_phone: clientPhone || null,
      trainer_name: trainerName || "Esther Fair",
      business_name: businessName || "Eternal Fitness",
      start_date: startDate || null,
      client_name_print: clientNamePrint || null,
      client_signature_date: clientSignatureDate || null,
      client_signature_data: clientSignature || null,
      client_typed_signature: clientTypedSignature || null,
      trainer_name_print: trainerNamePrint || "Esther Fair",
      trainer_signature_date: trainerSignatureDate || null,
      trainer_signature_data: trainerSignature || null,
      trainer_typed_signature: trainerTypedSignature || "Esther Fair",
      parq_completed: parqCompleted || "",
      parq_date: parqDate || null,
      parq_filed_by: parqFiledBy || null,
      medical_clearance: medicalClearance || "",
      medical_clearance_date: medicalClearanceDate || null,
      medical_clearance_from: medicalClearanceFrom || null,
      agreed_to_terms: agreedToTerms || false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
