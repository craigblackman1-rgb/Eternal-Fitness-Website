export interface ParqQuestion {
  q: string;
  text: string;
  note?: string;
}

export interface ParqSection {
  label: string;
  questions: ParqQuestion[];
}

export const section2Questions: ParqQuestion[] = [
  { q: "q1", text: "Has your doctor ever told you that you have a heart condition or cardiovascular disease?" },
  { q: "q2", text: "Do you feel pain, pressure, tightness, or heaviness in your chest during physical activity?" },
  { q: "q3", text: "Do you experience chest pain or discomfort at rest or when NOT exercising?" },
  { q: "q4", text: "Do you ever feel dizzy, faint, or lose consciousness during or after exercise?" },
  { q: "q5", text: "Do you experience unexplained shortness of breath at rest or with minimal exertion?" },
  { q: "q6", text: "Do you experience palpitations, irregular heartbeat, or a racing heart?" },
  { q: "q7", text: "Do you have high blood pressure or are you being treated for it?" },
  { q: "q8", text: "Do you have high cholesterol or are you being treated for it?" },
  { q: "q9", text: "Have you had a stroke or TIA (transient ischaemic attack)?" },
  { q: "q10", text: "Do you have diabetes (Type 1 or Type 2)?", note: "If yes, please give full details in Section 5." },
  { q: "q11", text: "Do you smoke or have you smoked in the last 5 years?" },
];

export const section3Questions: ParqQuestion[] = [
  { q: "q12", text: "Do you have any bone, joint, or muscle condition that could be affected by exercise?", note: "E.g. arthritis, osteoporosis, previous fractures, joint replacements." },
  { q: "q13", text: "Have you had any surgery in the last 5 years?", note: "If yes, please give details including dates in Section 5." },
  { q: "q14", text: "Do you have any implanted medical devices?", note: "E.g. pacemaker, defibrillator, neurostimulator, cochlear implant, spinal shunt, lumbar peritoneal shunt, VP shunt, insulin pump, or any other surgically implanted device. Please give full details in Section 5." },
  { q: "q15", text: "Have you ever had a spinal injury, spinal surgery, or been told to avoid spinal loading or high-impact activity?", note: "If yes, give full details in Section 5 including any restrictions given by your consultant." },
  { q: "q16", text: "Do you have any neurological condition?", note: "E.g. epilepsy, multiple sclerosis, Parkinson's disease, or any condition affecting balance, coordination, or sensation." },
  { q: "q17", text: "Do you experience chronic pain that affects your ability to exercise?" },
  { q: "q18", text: "Do you have any condition affecting your vision, hearing, or other senses that your trainer should be aware of?", note: "If yes, please give full details in Section 5." },
];

export const section4Questions: ParqQuestion[] = [
  { q: "q19", text: "Are you taking any blood-thinning medication (anticoagulants)?", note: "E.g. Warfarin, Apixaban, Rivaroxaban, Dabigatran, Clopidogrel, prescribed Aspirin. If yes — this significantly affects your risk of bruising and bleeding from falls or impacts. Your trainer must know." },
  { q: "q20", text: "Do you have any blood disorder or condition affecting your blood?", note: "E.g. polycythaemia rubra vera, haemophilia, anaemia, thrombocytopenia, leukaemia, sickle cell. If yes, give full details in Section 5." },
  { q: "q21", text: "Are you receiving any injection-based medication on a regular basis?", note: "E.g. insulin, Peg Interferon, biological therapy, B12. If yes, specify in Section 5 — some injection medications cause significant fatigue on injection day." },
  { q: "q22", text: "Are you taking any statin medication?", note: "E.g. Simvastatin, Atorvastatin, Rosuvastatin. Statins can cause muscle pain (myopathy). Please inform your trainer of any unusual muscle pain during or after sessions." },
  { q: "q23", text: "Are you taking any other prescription medication not listed above?", note: "If yes, list all medications in Section 5 including dosage and what they are prescribed for." },
  { q: "q24", text: "Do you have any diagnosed medical condition not already disclosed above?", note: "If yes, give full details in Section 5." },
  { q: "q25", text: "Have you been advised by any doctor, consultant, or medical professional to avoid or restrict certain types of exercise?", note: "If yes, describe the restrictions exactly and state who gave them in Section 5. Verbal restrictions are equally important to document." },
  { q: "q26", text: "Have you had any major illness, hospital admission, or operation in the last 5 years?", note: "If yes, give details in Section 5 including dates and treating hospital or consultant." },
];

export const section6bQuestions: ParqQuestion[] = [
  { q: "q27", text: "Are you currently pregnant or have you given birth in the last 6 months?" },
  { q: "q28", text: "Do you have any dietary restrictions, allergies, or eating disorder history your trainer should be aware of?", note: "Your trainer will treat all disclosures in confidence." },
  { q: "q29", text: "Do you have any other reason — physical, medical, or personal — why you feel you may not be able to participate safely in an exercise programme?" },
];

export const allQuestions = [
  ...section2Questions,
  ...section3Questions,
  ...section4Questions,
  ...section6bQuestions,
];

export const questionTextMap: Record<string, string> = {};
allQuestions.forEach((q) => {
  questionTextMap[q.q] = q.text;
});

export const parqSections: ParqSection[] = [
  { label: "Cardiovascular and General Health", questions: section2Questions },
  { label: "Musculoskeletal, Neurological, Surgical", questions: section3Questions },
  { label: "Blood, Medications, Diagnosed Conditions", questions: section4Questions },
  { label: "Additional Questions", questions: section6bQuestions },
];

export const parqSectionKeys: { label: string; qs: string[] }[] = parqSections.map((s) => ({
  label: s.label,
  qs: s.questions.map((q) => q.q),
}));
