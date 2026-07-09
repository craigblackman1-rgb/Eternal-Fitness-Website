export type TrainingLocation = "studio" | "home" | "both";
export type SessionsPerWeek = 1 | 2 | 3;
export type TimeTier = "compact" | "standard" | "extended";
export type Package = "12-week" | "24-week" | "ongoing";
export type FitnessLevel = 1 | 2 | 3 | 4 | 5;
export type StrengthLevel = "beginner" | "intermediate" | "advanced";
export type PrimaryGoal = "strength" | "mobility" | "weight_loss" | "rehabilitation" | "confidence" | "general_fitness";
export type Archetype = "A" | "B" | "C";
export type Phase = "foundation" | "build" | "develop" | "peak" | "deload";
export type BlockStatus = "draft" | "approved" | "active" | "complete";

export type ProfileOptionCategory = "condition" | "movement_quality_flag" | "milestone" | "adaptation" | "contraindication" | "pain_point";

export interface ProfileOption {
  id: string;
  category: ProfileOptionCategory;
  value: string;
  created_at: string;
}

export type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say";

export interface InjuryHistoryEntry {
  id: string;
  date: string | null;
  description: string;
  body_area: string;
  status: "active" | "monitoring" | "resolved";
}

export interface ClientProfile {
  client: {
    id: string;
    name: string;
    /** Derived from date_of_birth when present; kept for legacy records without a DOB. */
    age: number;
    date_of_birth: string | null;
    gender: Gender | "";
  };
  logistics: {
    training_location: TrainingLocation;
    sessions_per_week: SessionsPerWeek;
    time_tier: TimeTier;
    package: Package;
    block_number: number;
  };
  health: {
    gp_clearance: boolean;
    conditions: string[];
    contraindications: string[];
    medications_relevant: string[];
    injury_history: InjuryHistoryEntry[];
    pain_points: string[];
    /** Trainer-confirmed PAR-Q override — for clients screened via the external Microsoft Forms
     *  PAR-Q before it's ported into this system. Esther ticks this only once she's personally
     *  reviewed the submitted form; it stands in for `signed_parq` until the record is migrated. */
    parq_trainer_override?: boolean;
    parq_trainer_override_note?: string;
  };
  physical_baseline: {
    fitness_level: FitnessLevel;
    movement_quality_flags: string[];
    strength_baseline: {
      lower_body: StrengthLevel;
      upper_body: StrengthLevel;
      core: StrengthLevel;
    };
  };
  programming_adaptations: string[];
  goals: {
    primary: PrimaryGoal;
    secondary: string[];
    milestones: string[];
  };
  notes: {
    esther_observations: string;
    motivation_notes: string;
    watch_for: string;
  };
}

export interface ExerciseMedia {
  image_url?: string;
  video_url?: string;
}

export interface Exercise {
  exercise_name: string;
  sets: number;
  reps: string;
  tempo: string;
  rest: string;
  coaching_cue: string;
  modification: string;
  equipment: string[];
  media?: ExerciseMedia;
  /** Section within the main block, e.g. "Superset A", "Superset B", "Arms + Core", "Finisher". Absent on legacy data. */
  group_label?: string;
}

export interface SessionVersion {
  warm_up: Exercise[];
  main_block: Exercise[];
  cooldown: Exercise[];
}

export interface Session {
  session_id: string;
  block_id: string;
  client_id: string;
  session_number: number;
  archetype: Archetype;
  week: number;
  phase: Phase;
  focus_label: string;
  time_tier: TimeTier;
  versions: {
    studio: SessionVersion;
    home: SessionVersion;
  };
  coaching_notes: string;
  client_intro: string;
  session_log?: SessionLog;
}

export interface SessionLog {
  completed_at: string | null;
  rpe: number | null;
  fatigue: "low" | "moderate" | "high" | null;
  notes: string;
}

export type DBClientComplianceStatus = "clear" | "action_needed" | "do_not_train" | "pending_medical";
export type DBClientGroupType = "individual_journey" | "calendar_block";
export type DBClientPaceMode = "fast" | "medium" | "slow";
export type GpLetterStatus = "not_required" | "requested" | "received";
export type MedicalClearanceStatus = "cleared" | "pending" | "not_required" | "not_yet_requested";
export type RiskLevel = "low" | "medium" | "high";
export type PaymentStatus = "paid" | "deposit" | "pending" | "overdue" | "suspended";
export type ClientStatus = "active" | "inactive" | "completed" | "suspended";

export interface BlockSummary {
  block_number: number;
  period_start: string;
  period_end: string;
  attendance: {
    sessions_attended: number;
    sessions_scheduled: number;
    attendance_notes: string;
  };
  movements_introduced: string[];
  highlights: string;
  /** The single standout achievement of the block (leads the update email). */
  big_win?: string;
  areas_to_develop: string;
  discoveries: string;
  next_block_focus: string;
  worth_saying: string;
}

export interface DBClient {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  profile: ClientProfile;
  created_at: string;
  compliance_status: DBClientComplianceStatus;
  outstanding_actions: string[];
  group_type: DBClientGroupType;
  pace_mode: DBClientPaceMode;
  block_summaries?: BlockSummary[];
  client_number?: number;
  display_code?: string;
  email?: string | null;
  phone?: string | null;
  gp_letter_status: GpLetterStatus;
  gp_letter_requested_date: string | null;
  gp_letter_received_date: string | null;
  annual_review_due_date: string | null;
  clearance_from: string | null;
  specialist_name: string | null;
  // Clinical state (moved off signed_agreements — see 20260704_client_master_consolidation)
  medical_clearance_status: MedicalClearanceStatus;
  risk_level: RiskLevel;
  exercise_modifications: string | null;
  // Commercial state (moved off signed_agreements)
  package_type: string | null;
  sessions_purchased: number | null;
  sessions_used: number | null;
  sessions_remaining: number | null;
  session_duration: number | null;
  payment_method: string | null;
  payment_status: PaymentStatus;
  block_expiry_date: string | null;
  client_status: ClientStatus;
  referral_source: string | null;
}

/** Lifecycle of an update record. */
export type UpdateStatus = "draft" | "scheduled" | "sent" | "failed" | "cancelled";

export interface SentUpdate {
  id: string;
  client_id: string;
  subject: string;
  body_html: string;
  block_number: number;
  /** Actual send time — null until the update goes out (drafts/scheduled). */
  sent_at: string | null;
  template_kind: string;
  emailed: boolean;
  status: UpdateStatus;
  /** When a scheduled update should send — null for drafts/immediate. */
  scheduled_for: string | null;
  client_email: string | null;
  /** Structured section values (keys match the template registry). */
  sections: Record<string, string> | null;
  send_error: string | null;
  created_at: string;
  updated_at: string;
}

/** A sent_update row joined with its client, for the global report. */
export interface UpdateWithClient extends SentUpdate {
  client: { name: string; client_number: number } | null;
}

export interface DBBlock {
  id: string;
  client_id: string;
  block_number: number;
  status: BlockStatus;
  block_note: string | null;
  summary: string | null;
  created_at: string;
  approved_at: string | null;
}

export interface DBSession {
  id: string;
  block_id: string;
  session_number: number;
  archetype: Archetype;
  week: number;
  phase: Phase;
  data: Session;
}

export type DocumentStatus = "draft" | "sent" | "received" | "signed" | "expired" | "needs_update";
export type ClearanceStatus = "CLEARED" | "PENDING" | "NOT YET REQUESTED" | "NOT REQUIRED";
export type ClearanceRequired = "Y" | "N" | "NA";

export interface ClientDocument {
  id: string;
  client_id: string;
  status: DocumentStatus;
  sent_date: string | null;
  received_date: string | null;
  signed_at: string | null;
  requires_update: boolean;
  update_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignedAgreement extends ClientDocument {
  client_name: string;
  client_dob: string | null;
  client_address: string | null;
  client_email: string | null;
  client_phone: string | null;
  trainer_name: string;
  business_name: string;
  start_date: string | null;
  client_name_print: string | null;
  client_signature_date: string | null;
  client_signature_data: string | null;
  client_typed_signature: string | null;
  trainer_name_print: string;
  trainer_signature_date: string | null;
  trainer_signature_data: string | null;
  trainer_typed_signature: string;
  parq_completed: string;
  parq_date: string | null;
  parq_filed_by: string | null;
  medical_clearance: string;
  medical_clearance_date: string | null;
  medical_clearance_from: string | null;
  agreed_to_terms: boolean;
}

export interface SignedPARQ extends ClientDocument {
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
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string;
  q10: string;
  q11: string;
  q12: string;
  q13: string;
  q14: string;
  q15: string;
  q16: string;
  q17: string;
  q18: string;
  q19: string;
  q20: string;
  q21: string;
  q22: string;
  q23: string;
  q24: string;
  q25: string;
  q26: string;
  conditions: string | null;
  medications: string | null;
  devices: string | null;
  exercise_restrictions: string | null;
  surgeries: string | null;
  other_info: string | null;
  current_exercise: string | null;
  training_goals: string | null;
  q27: string;
  q28: string;
  q29: string;
  client_name_print: string | null;
  client_signature_date: string | null;
  client_signature_data: string | null;
  client_typed_signature: string | null;
}

export interface MedicalClearanceTracker {
  id: string;
  client_id: string | null;
  client_name: string;
  date_of_birth: string | null;
  parq_received_date: string | null;
  contract_signed_date: string | null;
  clearance_required: ClearanceRequired;
  conditions_requiring_clearance: string | null;
  clearance_from: string | null;
  specialist_name: string | null;
  gp_letter_requested_date: string | null;
  gp_letter_received_date: string | null;
  clearance_status: ClearanceStatus;
  clearance_filed: string;
  annual_review_due_date: string | null;
  last_session_delivered: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientDocumentsSummary {
  client_number: number | null;
  client_id: string;
  client_name: string;
  display_code: string | null;
  agreement_id: string | null;
  agreement_status: DocumentStatus | null;
  agreement_sent_date: string | null;
  agreement_received_date: string | null;
  agreement_signed_at: string | null;
  agreement_requires_update: boolean | null;
  agreement_update_notes: string | null;
  parq_id: string | null;
  parq_status: DocumentStatus | null;
  parq_sent_date: string | null;
  parq_received_date: string | null;
  parq_signed_at: string | null;
  parq_requires_update: boolean | null;
  parq_update_notes: string | null;
  tracker_id: string | null;
  clearance_status: ClearanceStatus | null;
  clearance_required: ClearanceRequired | null;
  tracker_parq_received: string | null;
  contract_signed_date: string | null;
  annual_review_due_date: string | null;
  last_session_delivered: string | null;
  tracker_notes: string | null;
  last_updated: string;
}

export interface ClientWithDocuments extends DBClient {
  documents: ClientDocumentsSummary;
}
