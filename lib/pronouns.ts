import type { Gender } from "@/types";

interface Pronouns {
  subject: string;     // she / he / they
  possessive: string;  // her / his / their
  possessiveStandalone: string; // hers / his / theirs
  object: string;      // her / him / them
  possessiveCapitalized: string; // Her / His / Their
}

const FEMALE: Pronouns = {
  subject: "she",
  possessive: "her",
  possessiveStandalone: "hers",
  object: "her",
  possessiveCapitalized: "Her",
};

const MALE: Pronouns = {
  subject: "he",
  possessive: "his",
  possessiveStandalone: "his",
  object: "him",
  possessiveCapitalized: "His",
};

const THEY: Pronouns = {
  subject: "they",
  possessive: "their",
  possessiveStandalone: "theirs",
  object: "them",
  possessiveCapitalized: "Their",
};

export function pronouns(gender: Gender | string | "" | null | undefined): Pronouns {
  if (gender === "female") return FEMALE;
  if (gender === "male") return MALE;
  return THEY;
}
