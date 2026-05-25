import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const body = await request.json();
  const {
    trainerNotes,
    packageType,
    sessionsPurchased,
    sessionDuration,
    paymentMethod,
    paymentStatus,
    sessionsUsed,
    sessionsRemaining,
    blockExpiryDate,
    medicalClearanceStatus,
    gpLetterRequestedDate,
    gpLetterReceivedDate,
    annualReviewDueDate,
    trainerObservations,
    riskLevel,
    exerciseModifications,
    watchFor,
    referralSource,
    clientStatus,
  } = body;

  const { data, error } = await supabase
    .from("signed_agreements")
    .update({
      trainer_notes: trainerNotes ?? undefined,
      package_type: packageType ?? undefined,
      sessions_purchased: sessionsPurchased ?? undefined,
      session_duration: sessionDuration ?? undefined,
      payment_method: paymentMethod ?? undefined,
      payment_status: paymentStatus ?? undefined,
      sessions_used: sessionsUsed ?? undefined,
      sessions_remaining: sessionsRemaining ?? undefined,
      block_expiry_date: blockExpiryDate ?? undefined,
      medical_clearance_status: medicalClearanceStatus ?? undefined,
      gp_letter_requested_date: gpLetterRequestedDate ?? undefined,
      gp_letter_received_date: gpLetterReceivedDate ?? undefined,
      annual_review_due_date: annualReviewDueDate ?? undefined,
      trainer_observations: trainerObservations ?? undefined,
      risk_level: riskLevel ?? undefined,
      exercise_modifications: exerciseModifications ?? undefined,
      watch_for: watchFor ?? undefined,
      referral_source: referralSource ?? undefined,
      client_status: clientStatus ?? undefined,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
