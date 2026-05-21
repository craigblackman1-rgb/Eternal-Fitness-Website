import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = createClient();

  const body = await request.json();
  const {
    fullName,
    dateOfBirth,
    address,
    email,
    phone,
    emergencyContactName,
    emergencyContactPhone,
    gpName,
    gpSurgery,
    gpPhone,
    q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11,
    q12, q13, q14, q15, q16, q17, q18,
    q19, q20, q21, q22, q23, q24, q25, q26,
    conditions,
    medications,
    devices,
    exerciseRestrictions,
    surgeries,
    otherInfo,
    currentExercise,
    trainingGoals,
    q27, q28, q29,
    clientNamePrint,
    clientSignatureDate,
    clientSignature,
    clientTypedSignature,
  } = body;

  if (!fullName?.trim()) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  const hasSignature = clientSignature || clientTypedSignature;
  if (!hasSignature) {
    return NextResponse.json({ error: "Client signature is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("signed_parq")
    .insert({
      full_name: fullName.trim(),
      date_of_birth: dateOfBirth || null,
      address: address || null,
      email: email || null,
      phone: phone || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
      gp_name: gpName || null,
      gp_surgery: gpSurgery || null,
      gp_phone: gpPhone || null,
      q1: q1 || null, q2: q2 || null, q3: q3 || null, q4: q4 || null, q5: q5 || null,
      q6: q6 || null, q7: q7 || null, q8: q8 || null, q9: q9 || null, q10: q10 || null,
      q11: q11 || null, q12: q12 || null, q13: q13 || null, q14: q14 || null, q15: q15 || null,
      q16: q16 || null, q17: q17 || null, q18: q18 || null, q19: q19 || null, q20: q20 || null,
      q21: q21 || null, q22: q22 || null, q23: q23 || null, q24: q24 || null, q25: q25 || null,
      q26: q26 || null, q27: q27 || null, q28: q28 || null, q29: q29 || null,
      conditions: conditions || null,
      medications: medications || null,
      devices: devices || null,
      exercise_restrictions: exerciseRestrictions || null,
      surgeries: surgeries || null,
      other_info: otherInfo || null,
      current_exercise: currentExercise || null,
      training_goals: trainingGoals || null,
      client_name_print: clientNamePrint || null,
      client_signature_date: clientSignatureDate || null,
      client_signature_data: clientSignature || null,
      client_typed_signature: clientTypedSignature || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
