import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { resolveClientId } from "@/lib/resolve-client-id";

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const clientName = searchParams.get("client_name");

  if (!clientName) {
    return NextResponse.json({ error: "client_name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("signed_parq")
    .select("*")
    .eq("full_name", clientName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createClient();

  const body = await request.json();
  const {
    id,
    client_name,
    client_number,
    full_name,
    date_of_birth,
    address,
    email,
    phone,
    emergency_contact_name,
    emergency_contact_phone,
    gp_name,
    gp_surgery,
    gp_phone,
    q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11,
    q12, q13, q14, q15, q16, q17, q18,
    q19, q20, q21, q22, q23, q24, q25, q26,
    q27, q28, q29,
    conditions,
    medications,
    devices,
    exercise_restrictions,
    surgeries,
    other_info,
    current_exercise,
    training_goals,
    client_name_print,
    client_signature_date,
    client_signature,
    client_typed_signature,
  } = body;

  const clientId = id ? undefined : await resolveClientId(supabase, client_number);

  const record = {
    ...(clientId ? { client_id: clientId } : {}),
    full_name: (full_name || client_name || "").trim(),
    date_of_birth: date_of_birth || null,
    address: address || null,
    email: email || null,
    phone: phone || null,
    emergency_contact_name: emergency_contact_name || null,
    emergency_contact_phone: emergency_contact_phone || null,
    gp_name: gp_name || null,
    gp_surgery: gp_surgery || null,
    gp_phone: gp_phone || null,
    q1: q1 || "", q2: q2 || "", q3: q3 || "", q4: q4 || "", q5: q5 || "",
    q6: q6 || "", q7: q7 || "", q8: q8 || "", q9: q9 || "", q10: q10 || "",
    q11: q11 || "", q12: q12 || "", q13: q13 || "", q14: q14 || "", q15: q15 || "",
    q16: q16 || "", q17: q17 || "", q18: q18 || "",
    q19: q19 || "", q20: q20 || "", q21: q21 || "", q22: q22 || "", q23: q23 || "",
    q24: q24 || "", q25: q25 || "", q26: q26 || "",
    q27: q27 || "", q28: q28 || "", q29: q29 || "",
    conditions: conditions || null,
    medications: medications || null,
    devices: devices || null,
    exercise_restrictions: exercise_restrictions || null,
    surgeries: surgeries || null,
    other_info: other_info || null,
    current_exercise: current_exercise || null,
    training_goals: training_goals || null,
    client_name_print: client_name_print || null,
    client_signature_date: client_signature_date || null,
    client_signature_data: client_signature || null,
    client_typed_signature: client_typed_signature || null,
    status: "signed",
  };

  let result;
  let error;

  if (id) {
    // Update existing record
    const res = await supabase.from("signed_parq").update(record).eq("id", id).select().single();
    result = res.data;
    error = res.error;
  } else {
    // Create new record
    const res = await supabase.from("signed_parq").insert(record).select().single();
    result = res.data;
    error = res.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(result, { status: id ? 200 : 201 });
}
