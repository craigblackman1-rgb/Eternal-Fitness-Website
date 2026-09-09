import type { Gender } from "@/types";

interface Pronouns {
  subject: string;     // she / he / they
  possessive: string;  // her / his / their
  possessiveStandalone: string; // hers / his / theirs
  object: string;      // her / him / them
  possessiveCapitalized: string; // Her / His / Their
  verb: string;        // has / have
}

const FEMALE: Pronouns = {
  subject: "she",
  possessive: "her",
  possessiveStandalone: "hers",
  object: "her",
  possessiveCapitalized: "Her",
  verb: "has",
};

const MALE: Pronouns = {
  subject: "he",
  possessive: "his",
  possessiveStandalone: "his",
  object: "him",
  possessiveCapitalized: "His",
  verb: "has",
};

const THEY: Pronouns = {
  subject: "they",
  possessive: "their",
  possessiveStandalone: "theirs",
  object: "them",
  possessiveCapitalized: "Their",
  verb: "have",
};

export function pronouns(gender: Gender | string | "" | null | undefined): Pronouns {
  if (gender === "female") return FEMALE;
  if (gender === "male") return MALE;
  return THEY;
}
