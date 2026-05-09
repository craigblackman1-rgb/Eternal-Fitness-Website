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

export interface ClientProfile {
  client: {
    id: string;
    name: string;
    age: number;
    gender: string;
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
    injury_history: string[];
    pain_points: string[];
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
}

export interface DBClient {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  profile: ClientProfile;
  created_at: string;
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
