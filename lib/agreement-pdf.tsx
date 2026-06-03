import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { parqSections } from "./parq-data";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2", fontWeight: "normal" },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTcviYwY.woff2", fontWeight: "bold" },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcC43FwrK3iLTcviYwY.woff2", fontStyle: "italic" },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Inter", fontSize: 9, lineHeight: 1.4, color: "#1E1E1E" },
  header: { borderBottomWidth: 3, borderBottomColor: "#087E8B", paddingBottom: 10, marginBottom: 16 },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: "#1E1E1E" },
  headerSubtitle: { fontSize: 12, fontWeight: "bold", color: "#087E8B", marginTop: 4 },
  headerMeta: { fontSize: 8, color: "#525A61", fontStyle: "italic", marginTop: 4 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: "#1E1E1E", marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: "#D9D9D9" },
  subsectionTitle: { fontSize: 9, fontWeight: "bold", color: "#087E8B", marginTop: 6, marginBottom: 2 },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  grid3: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  field: { width: "48%", marginBottom: 4 },
  fieldThird: { width: "31%", marginBottom: 4 },
  fieldLabel: { fontSize: 7, color: "#525A61", textTransform: "uppercase", marginBottom: 1 },
  fieldValue: { fontSize: 9, color: "#1E1E1E" },
  fieldItalic: { fontSize: 9, color: "#525A61", fontStyle: "italic" },
  paragraph: { fontSize: 8, marginBottom: 4, textAlign: "justify" },
  signatureBox: { borderWidth: 1, borderColor: "#D9D9D9", borderRadius: 4, padding: 8, width: "48%" },
  signatureBoxTrainer: { borderWidth: 1, borderColor: "#D9D9D9", borderRadius: 4, padding: 8, width: "48%", backgroundColor: "#F1F1F1" },
  signatureTitle: { fontSize: 9, fontWeight: "bold", marginBottom: 4 },
  signatureImg: { height: 30, marginTop: 4 },
  bgGray: { backgroundColor: "#F1F1F1", borderRadius: 4, padding: 8, marginBottom: 8 },
  bgLight: { backgroundColor: "#F1F1F1", borderRadius: 4, padding: 8 },
  list: { marginLeft: 12, marginBottom: 4 },
  listItem: { fontSize: 8, marginBottom: 2 },
  footer: { borderTopWidth: 1, borderTopColor: "#D9D9D9", paddingTop: 8, marginTop: 16, alignItems: "center" },
  footerText: { fontSize: 7, color: "#525A61", textAlign: "center" },
  row: { flexDirection: "row", gap: 8 },
  watchBox: { borderWidth: 1, borderColor: "#FECACA", borderRadius: 4, padding: 6, backgroundColor: "#FEF2F2", marginTop: 4 },
  watchText: { fontSize: 8, color: "#DC2626" },
  check: { color: "#16A34A", marginRight: 4 },
  cross: { color: "#DC2626", marginRight: 4 },
  parqRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 6, backgroundColor: "#F1F1F1", borderRadius: 3, marginBottom: 2 },
  parqText: { fontSize: 8, color: "#1E1E1E", width: "75%" },
  parqYes: { fontSize: 8, color: "#DC2626", fontWeight: "bold" },
  parqNo: { fontSize: 8, color: "#16A34A" },
  parqDash: { fontSize: 8, color: "#9CA3AF" },
  parqSectionLabel: { fontSize: 9, fontWeight: "bold", color: "#087E8B", marginTop: 8, marginBottom: 3 },
  parqDetailBox: { backgroundColor: "#F1F1F1", borderRadius: 4, padding: 6, marginBottom: 4 },
});

interface AgreementData {
  id: string;
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
  trainer_name_print: string | null;
  trainer_signature_date: string | null;
  trainer_signature_data: string | null;
  trainer_typed_signature: string | null;
  parq_completed: string;
  parq_date: string | null;
  parq_filed_by: string | null;
  medical_clearance: string;
  medical_clearance_date: string | null;
  medical_clearance_from: string | null;
  agreed_to_terms: boolean;
  signed_at: string;
  trainer_notes: string | null;
  package_type: string | null;
  sessions_purchased: number | null;
  session_duration: number | null;
  payment_method: string | null;
  payment_status: string | null;
  sessions_used: number | null;
  sessions_remaining: number | null;
  block_expiry_date: string | null;
  medical_clearance_status: string | null;
  gp_letter_requested_date: string | null;
  gp_letter_received_date: string | null;
  annual_review_due_date: string | null;
  trainer_observations: string | null;
  risk_level: string | null;
  exercise_modifications: string | null;
  watch_for: string | null;
  referral_source: string | null;
  client_status: string | null;
}

interface ParqData {
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
  q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; q7: string; q8: string; q9: string; q10: string; q11: string;
  q12: string; q13: string; q14: string; q15: string; q16: string; q17: string; q18: string;
  q19: string; q20: string; q21: string; q22: string; q23: string; q24: string; q25: string; q26: string;
  q27: string; q28: string; q29: string;
  conditions: string | null;
  medications: string | null;
  devices: string | null;
  exercise_restrictions: string | null;
  surgeries: string | null;
  other_info: string | null;
  current_exercise: string | null;
  training_goals: string | null;
  client_name_print: string | null;
  client_signature_date: string | null;
  client_typed_signature: string | null;
}

const fmt = (d: string | null) => {
  if (!d) return "—";
  try {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d;
  }
};

const yn = (v: string) => v === "yes" ? "YES" : v === "no" ? "NO" : "—";

const Field = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || "—"}</Text>
  </View>
);

const FieldThird = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.fieldThird}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || "—"}</Text>
  </View>
);

const ParqQuestion = ({ text, answer }: { text: string; answer: string }) => (
  <View style={styles.parqRow}>
    <Text style={styles.parqText}>{text}</Text>
    <Text style={answer === "yes" ? styles.parqYes : answer === "no" ? styles.parqNo : styles.parqDash}>{yn(answer)}</Text>
  </View>
);

export const AgreementPDF = ({ agreement, parqData }: { agreement: AgreementData; parqData?: ParqData | null }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eternal ♥ Fitness</Text>
        <Text style={styles.headerSubtitle}>Personal Training Agreement — Signed Copy</Text>
        <Text style={styles.headerMeta}>Signed by {agreement.client_name} on {fmt(agreement.client_signature_date)}</Text>
      </View>

      {/* Section A: Parties */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>A. Parties to this agreement</Text>
        <View style={styles.grid2}>
          <Field label="Client full name" value={agreement.client_name} />
          <Field label="Date of birth" value={fmt(agreement.client_dob)} />
          <Field label="Start date" value={fmt(agreement.start_date)} />
          <Field label="Email" value={agreement.client_email || ""} />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Address</Text>
          <Text style={styles.fieldValue}>{agreement.client_address || "—"}</Text>
        </View>
        <View style={styles.grid2}>
          <Field label="Phone" value={agreement.client_phone || ""} />
          <Field label="Trainer" value={agreement.trainer_name} />
        </View>
      </View>

      {/* Sections 1-7: Terms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1–7. Agreement Terms</Text>
        <Text style={styles.subsectionTitle}>1. The trainer&apos;s commitments</Text>
        <Text style={styles.paragraph}>The trainer will deliver all sessions professionally, in accordance with their qualifications, current industry guidelines, and within their scope of practice. The trainer will maintain current, valid professional liability insurance. The trainer will design a programme based on the client&apos;s stated goals, health screening information, and assessment results. All personal, medical, and training information will be held in strict confidence in accordance with UK GDPR / Data Protection Act 2018.</Text>
        <Text style={styles.subsectionTitle}>2. The client&apos;s responsibilities</Text>
        <Text style={styles.paragraph}>The client agrees to disclose all relevant health information on the PAR-Q, update the trainer immediately of any changes, seek medical clearance where required, and cancel sessions with at least 24 hours notice.</Text>
        <Text style={styles.subsectionTitle}>3. Medical clearance requirements</Text>
        <Text style={styles.paragraph}>Conditions requiring written GP or specialist clearance include: implanted medical devices, anticoagulant medication, blood disorders, cardiac conditions, uncontrolled hypertension, neurological conditions, recent surgery, active cancer treatment, Type 1 diabetes, and epilepsy.</Text>
        <Text style={styles.subsectionTitle}>4. Payment terms</Text>
        <Text style={styles.paragraph}>12-session blocks valid for 120 days. 24-session blocks valid for 240 days. Full payment required before commencement. £100 non-refundable deposit to secure time slots. Rolling contracts minimum 3-month term. No refunds for unused sessions.</Text>
        <Text style={styles.subsectionTitle}>5. Risk, liability, and safety</Text>
        <Text style={styles.paragraph}>The client acknowledges inherent risks of exercise. The trainer&apos;s liability is limited to direct loss caused by negligence. No liability for injury from non-disclosed conditions, independent training, or pre-existing conditions.</Text>
        <Text style={styles.subsectionTitle}>6. Data protection and privacy</Text>
        <Text style={styles.paragraph}>Client records retained for minimum 7 years then securely destroyed. Client has right to access personal data at any time with 30-day response.</Text>
        <Text style={styles.subsectionTitle}>7. General terms</Text>
        <Text style={styles.paragraph}>This agreement together with the completed PAR-Q constitutes the entire agreement. Amendments must be signed in writing. Governed by laws of England and Wales.</Text>
      </View>

      {/* Section 8: Signatures */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Agreement and signatures</Text>
        <View style={styles.bgGray}>
          <Text style={styles.paragraph}>By signing below, both parties confirm that they have read and understood this agreement in full. The client confirms that they have completed the PAR-Q honestly and accept all terms.</Text>
        </View>
        <View style={{ ...styles.row, justifyContent: "space-between", marginBottom: 12 }}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Client</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Name (print)</Text>
              <Text style={styles.fieldValue}>{agreement.client_name_print || "—"}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Date</Text>
              <Text style={styles.fieldValue}>{fmt(agreement.client_signature_date)}</Text>
            </View>
            {agreement.client_typed_signature && (
              <View style={{ marginTop: 4 }}>
                <Text style={styles.fieldLabel}>Signature</Text>
                <Text style={{ ...styles.fieldValue, fontStyle: "italic", fontSize: 12 }}>{agreement.client_typed_signature}</Text>
              </View>
            )}
          </View>
          <View style={styles.signatureBoxTrainer}>
            <Text style={styles.signatureTitle}>Trainer (auto-signed)</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Name (print)</Text>
              <Text style={styles.fieldValue}>{agreement.trainer_name_print || "—"}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Date</Text>
              <Text style={styles.fieldValue}>{fmt(agreement.trainer_signature_date)}</Text>
            </View>
            <View style={{ marginTop: 4 }}>
              <Text style={styles.fieldLabel}>Signature</Text>
              <Text style={{ ...styles.fieldValue, fontStyle: "italic", fontSize: 12 }}>{agreement.trainer_typed_signature || "—"}</Text>
            </View>
          </View>
        </View>

        {/* PAR-Q and Medical clearance filing */}
        <View style={styles.bgLight}>
          <View style={styles.row}>
            <FieldThird label="PAR-Q completed" value={(agreement.parq_completed || "—").toUpperCase()} />
            <FieldThird label="Date" value={fmt(agreement.parq_date)} />
            <FieldThird label="Filed by" value={agreement.parq_filed_by || "—"} />
          </View>
          <View style={styles.row}>
            <FieldThird label="Medical clearance" value={(agreement.medical_clearance || "—").toUpperCase()} />
            <FieldThird label="Date" value={fmt(agreement.medical_clearance_date)} />
            <FieldThird label="From" value={agreement.medical_clearance_from || "—"} />
          </View>
        </View>
      </View>

      {/* PAR-Q Full Answers */}
      {parqData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAR-Q — Physical Activity Readiness Questionnaire</Text>

          {/* Personal Details */}
          <View style={styles.bgGray}>
            <View style={styles.grid2}>
              <Field label="Name" value={parqData.full_name} />
              <Field label="Date of birth" value={fmt(parqData.date_of_birth)} />
              <Field label="Address" value={parqData.address || ""} />
              <Field label="Phone" value={parqData.phone || ""} />
              <Field label="Emergency contact" value={`${parqData.emergency_contact_name || "—"} (${parqData.emergency_contact_phone || "—"})`} />
              <Field label="GP" value={`${parqData.gp_name || "—"} — ${parqData.gp_surgery || "—"}`} />
            </View>
          </View>

          {/* Questions */}
          {parqSections.map((section) => (
            <View key={section.label}>
              <Text style={styles.parqSectionLabel}>{section.label}</Text>
              {section.questions.map(({ q, text }) => (
                <ParqQuestion key={q} text={text} answer={parqData[q as keyof ParqData] as string} />
              ))}
            </View>
          ))}

          {/* Full Details */}
          {(parqData.conditions || parqData.medications || parqData.devices || parqData.exercise_restrictions || parqData.surgeries || parqData.other_info) && (
            <>
              <Text style={styles.parqSectionLabel}>Full Details</Text>
              {parqData.conditions && <View style={styles.parqDetailBox}><Text style={styles.fieldLabel}>Medical conditions</Text><Text style={styles.fieldValue}>{parqData.conditions}</Text></View>}
              {parqData.medications && <View style={styles.parqDetailBox}><Text style={styles.fieldLabel}>Medications</Text><Text style={styles.fieldValue}>{parqData.medications}</Text></View>}
              {parqData.devices && <View style={styles.parqDetailBox}><Text style={styles.fieldLabel}>Implanted devices</Text><Text style={styles.fieldValue}>{parqData.devices || "—"}</Text></View>}
              {parqData.exercise_restrictions && <View style={styles.parqDetailBox}><Text style={styles.fieldLabel}>Exercise restrictions</Text><Text style={styles.fieldValue}>{parqData.exercise_restrictions}</Text></View>}
              {parqData.surgeries && <View style={styles.parqDetailBox}><Text style={styles.fieldLabel}>Surgeries</Text><Text style={styles.fieldValue}>{parqData.surgeries}</Text></View>}
              {parqData.other_info && <View style={styles.parqDetailBox}><Text style={styles.fieldLabel}>Other information</Text><Text style={styles.fieldValue}>{parqData.other_info}</Text></View>}
            </>
          )}

          {/* Lifestyle */}
          {(parqData.current_exercise || parqData.training_goals) && (
            <>
              <Text style={styles.parqSectionLabel}>Lifestyle and Physical Activity</Text>
              {parqData.current_exercise && <View style={styles.parqDetailBox}><Text style={styles.fieldLabel}>Current exercise</Text><Text style={styles.fieldValue}>{parqData.current_exercise}</Text></View>}
              {parqData.training_goals && <View style={styles.parqDetailBox}><Text style={styles.fieldLabel}>Training goals</Text><Text style={styles.fieldValue}>{parqData.training_goals}</Text></View>}
            </>
          )}

          {/* Signature */}
          <View style={styles.bgLight}>
            <View style={styles.row}>
              <FieldThird label="Client name (print)" value={parqData.client_name_print || ""} />
              <FieldThird label="Date" value={fmt(parqData.client_signature_date)} />
              <FieldThird label="Signature" value={parqData.client_typed_signature || ""} />
            </View>
          </View>
        </View>
      )}

      {/* Trainer Information */}
      {(agreement.trainer_notes || agreement.trainer_observations || agreement.exercise_modifications || agreement.watch_for || agreement.package_type || agreement.risk_level) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trainer Information</Text>
          {agreement.package_type && (
            <View style={styles.row}>
              <FieldThird label="Package" value={agreement.package_type} />
              {agreement.sessions_purchased && <FieldThird label="Sessions" value={`${agreement.sessions_purchased} × ${agreement.session_duration || 60}min`} />}
              {agreement.payment_status && <FieldThird label="Payment" value={agreement.payment_status.toUpperCase()} />}
            </View>
          )}
          {agreement.sessions_used !== null && agreement.sessions_used !== undefined && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Sessions used / remaining</Text>
              <Text style={styles.fieldValue}>{agreement.sessions_used} / {agreement.sessions_remaining ?? "?"}</Text>
            </View>
          )}
          {agreement.block_expiry_date && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Block expiry</Text>
              <Text style={styles.fieldValue}>{fmt(agreement.block_expiry_date)}</Text>
            </View>
          )}
          {agreement.medical_clearance_status && agreement.medical_clearance_status !== "not_required" && (
            <View style={styles.row}>
              <FieldThird label="Clearance status" value={agreement.medical_clearance_status.replace(/_/g, " ").toUpperCase()} />
              {agreement.gp_letter_requested_date && <FieldThird label="GP letter requested" value={fmt(agreement.gp_letter_requested_date)} />}
              {agreement.gp_letter_received_date && <FieldThird label="GP letter received" value={fmt(agreement.gp_letter_received_date)} />}
            </View>
          )}
          {agreement.risk_level && (
            <View style={styles.row}>
              <FieldThird label="Risk level" value={agreement.risk_level.toUpperCase()} />
              {agreement.client_status && <FieldThird label="Client status" value={agreement.client_status.toUpperCase()} />}
              {agreement.annual_review_due_date && <FieldThird label="Annual review due" value={fmt(agreement.annual_review_due_date)} />}
            </View>
          )}
          {agreement.exercise_modifications && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Exercise modifications</Text>
              <Text style={styles.fieldValue}>{agreement.exercise_modifications}</Text>
            </View>
          )}
          {agreement.watch_for && (
            <View style={styles.watchBox}>
              <Text style={styles.fieldLabel}>Watch for</Text>
              <Text style={styles.watchText}>{agreement.watch_for}</Text>
            </View>
          )}
          {agreement.trainer_observations && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Trainer observations</Text>
              <Text style={styles.fieldValue}>{agreement.trainer_observations}</Text>
            </View>
          )}
          {agreement.trainer_notes && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Trainer notes</Text>
              <Text style={styles.fieldValue}>{agreement.trainer_notes}</Text>
            </View>
          )}
        </View>
      )}

      {/* Acceptance */}
      <View style={styles.section}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={agreement.agreed_to_terms ? styles.check : styles.cross}>{agreement.agreed_to_terms ? "✓" : "✗"}</Text>
          <Text style={styles.fieldValue}>Terms accepted: <Text style={{ fontWeight: "bold" }}>{agreement.agreed_to_terms ? "Yes" : "No"}</Text></Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Eternal ♥ Fitness · Personal Training Agreement · Signed copy · Confidential — held securely on file</Text>
        <Text style={styles.footerText}>Record ID: {agreement.id} · Signed: {fmt(agreement.signed_at)}</Text>
      </View>
    </Page>
  </Document>
);
