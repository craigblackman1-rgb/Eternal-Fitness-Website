"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DrawerShell, useDrawerManager } from "./DrawerManager";
import { sessionWorkoutName, isOutlookPlaceholder, isTrainerizeImported } from "@/lib/session-display";
import { UpdateIntervalControl } from "./UpdateIntervalControl";
import { ClientTasksPanel, type ClientTasksPanelHandle } from "./ClientTasksPanel";
import { PortalAccountCard } from "./PortalAccountCard";
import { MergedNotesPanel } from "./MergedNotesPanel";
import { PrescriptionTable } from "@/components/hub/PrescriptionTable";
// components/hub/ClinicalComplianceCard.tsx is deliberately NOT wired in here —
// every field it edits (medical_clearance_status, risk_level,
// exercise_modifications) is already covered by ClearedToTrainCard below;
// adding it too would give those fields a second, out-of-sync editor.
import { GpLetterCard } from "@/components/hub/GpLetterCard";
import { PackagePaymentsCard } from "@/components/hub/PackagePaymentsCard";
import { GracePeriodExtension } from "@/components/hub/GracePeriodExtension";
import { PotLedger } from "./PotLedger";
import type { DBBlock, DBSession, SessionNoteData, PinnedNoteRef } from "@/types";
import type { ExerciseTrend } from "@/lib/progress";
import type { ComplianceFlags } from "@/lib/compliance";
import type { UpdateInterval, UpdateDueInfo } from "@/lib/updates-due";
import type { AggregatedExerciseNote } from "@/lib/exercise-notes";
import type {
  TrainerizeHistoryData,
  TrainerizePerformedWorkoutSummary,
  TrainerizePerformedExerciseDetail,
} from "@/components/hub";

/* ── ClientDrawers — real drawer content for the five reference doors plus
   the training content drawers. Each drawer receives data threaded from
   page.tsx → ClientRecordShell → here. */

interface ClientDrawersProps {
  client: any;
  blocks: DBBlock[];
  sessions: DBSession[];
  latestBlock: DBBlock | null;
  portalAccount: any;
  clientNotes: any[];
  clientReviews: any[];
  bandSetName: string | null;
  missingBandSet: boolean;
  allTaskRows: any[];
  clientDocuments: any[];
  legacyDocumentRows: any[];
  flags: ComplianceFlags;
  clientUpdates: any[];
  dueInfo: UpdateDueInfo;
  clientId: string;
  updateInterval: UpdateInterval | null;
  updateIntervalWeeks: number | null;
  updateIntervalNextDate: string | null;
  lastSentAt: string | null;
  currentUserName: string | null;
  exerciseTrends: ExerciseTrend[];
  exerciseTrendSummary?: {
    totalExercisesLogged: number;
    personalBests: number;
    heaviestLift: string | null;
    belowBestCount: number;
    recentNotes: string | null;
  };
  trainerizeHistory: TrainerizeHistoryData;
  ruleTypesById: Map<string, any>;
  complianceLookup: any;
  gpClearance: any;
  sessionsRemaining: number | null;
  sessionsUsed: number | null;
  paymentStatus: string;
  packageType: string | null;
  medicalClearanceStatus: string;
  riskLevel: string;
  annualReviewDueDate: string | null;
  clearanceFrom: string | null;
  specialistName: string | null;
  exerciseModifications: string | null;
  clientStatus: string;
  referralSource: string | null;
  startDate: string | null;
  blockExpiryDate: string | null;
  blockSessionCountMismatch: boolean;
  unpaidBlocks: string[];
  countCompletedSessions: number;
  /* Profile drawer merged notes panel (CR-EF-098) */
  sessionNotes: SessionNoteData[];
  exerciseNotes: AggregatedExerciseNote[];
  pinnedNoteRefs: PinnedNoteRef[];
  baselineUsed: number;
  hubUsedCount: number;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtShortDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROFILE — identity only
   ═══════════════════════════════════════════════════════════════════════════ */

function ProfileDrawer({ client, portalAccount, clientNotes, sessionNotes, exerciseNotes, pinnedNoteRefs }: {
  client: any;
  portalAccount: any;
  clientNotes: any[];
  sessionNotes: SessionNoteData[];
  exerciseNotes: AggregatedExerciseNote[];
  pinnedNoteRefs: PinnedNoteRef[];
}) {
  const p = client.profile;
  const emergency = p?.emergency_contact;

  return (
    <DrawerShell id="dw-profile" title="Profile" subtitle="Who this client is" width="md">
      {/* Who she is */}
      <IdentityCard
        clientNumber={client.client_number}
        name={client.name}
        email={client.email}
        phone={client.phone}
        dateOfBirth={p?.client?.date_of_birth ?? null}
        gender={client.gender}
      />

      {/* Emergency contact */}
      <div className="fcard acc-rose">
        <div className="fcard-h">Emergency contact</div>
        <div className="fcard-b pad">
          {emergency?.name ? (
            <div className="fgrid">
              <div className="frow"><span className="fk">Name</span><span className="fv">{emergency.name}</span></div>
              {emergency.relationship && <div className="frow"><span className="fk">Relationship</span><span className="fv">{emergency.relationship}</span></div>}
              {emergency.phone && <div className="frow"><span className="fk">Phone</span><span className="fv">{emergency.phone}</span></div>}
            </div>
          ) : (
            <p className="miss" style={{ margin: 0 }}>Nobody recorded.</p>
          )}
        </div>
      </div>

      <div className="fcard">
        <div className="fcard-h">
          Portal
          {portalAccount && !portalAccount.disabled_at && (
            <span className="ml-auto text-[12px] font-normal normal-case tracking-normal" style={{ color: "var(--color-body)" }}>
              {(() => {
                const rv = client.resource_visibility;
                if (!rv || Object.keys(rv).length === 0) return "Default visibility";
                const allOn = Object.values(rv).every(Boolean);
                return allOn ? "All resources are switched on" : "Custom visibility";
              })()}
            </span>
          )}
        </div>
        <div className="fcard-b">
          <PortalAccountCard clientNumber={client.client_number} hasEmail={!!client.email} />
        </div>
      </div>

      {/* Your notes \u2014 profile.notes (client_intro / observations / motivation /
          watch_for) is a structured block edited from the full record editor
          (clients/[id]/edit), not by this drawer, so it stays a read-only
          summary here. The freeform quick-capture list below it is now the
          live MergedNotesPanel (CR-EF-098) instead of a static top-5 slice of
          client_notes with no way to add, delete, or see session/exercise
          notes alongside it. */}
      {(() => {
        const n = client.profile?.notes;
        const hasProfileNotes = n && (n.client_intro || n.esther_observations || n.motivation_notes || n.watch_for);
        if (!hasProfileNotes) return null;
        return (
          <div className="fcard acc-ink">
            <div className="fcard-h">From the profile</div>
            <div className="fcard-b pad">
              <div className="space-y-2">
                {n.client_intro && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--color-ink)", opacity: 0.5 }}>Client intro</div>
                    <p className="text-[13px] text-[var(--color-ink)] m-0" style={{ whiteSpace: "pre-wrap" }}>{n.client_intro}</p>
                  </div>
                )}
                {n.esther_observations && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--color-ink)", opacity: 0.5 }}>Observations</div>
                    <p className="text-[13px] text-[var(--color-ink)] m-0" style={{ whiteSpace: "pre-wrap" }}>{n.esther_observations}</p>
                  </div>
                )}
                {n.motivation_notes && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--color-ink)", opacity: 0.5 }}>Motivation</div>
                    <p className="text-[13px] text-[var(--color-ink)] m-0" style={{ whiteSpace: "pre-wrap" }}>{n.motivation_notes}</p>
                  </div>
                )}
                {n.watch_for && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--color-ink)", opacity: 0.5 }}>Watch for</div>
                    <p className="text-[13px] text-[var(--color-ink)] m-0" style={{ whiteSpace: "pre-wrap" }}>{n.watch_for}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <MergedNotesPanel
        clientId={client.id}
        clientName={client.name}
        sessionNotes={sessionNotes}
        exerciseNotes={exerciseNotes}
        pinnedNoteRefs={pinnedNoteRefs}
      />

      {/* Record */}
      <RecordCard
        clientNumber={client.client_number}
        clientSince={client.start_date ?? client.created_at}
        referralSource={client.referral_source}
      />
    </DrawerShell>
  );
}

/* \u2500\u2500 Editable identity card (Profile drawer) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

function IdentityCard({ clientNumber, name, email, phone, dateOfBirth, gender }: {
  clientNumber: number;
  name: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fName, setFName] = useState(name ?? "");
  const [fEmail, setFEmail] = useState(email ?? "");
  const [fPhone, setFPhone] = useState(phone ?? "");
  const [fDob, setFDob] = useState(dateOfBirth ? String(dateOfBirth).slice(0, 10) : "");

  const cancel = () => {
    setFName(name ?? "");
    setFEmail(email ?? "");
    setFPhone(phone ?? "");
    setFDob(dateOfBirth ? String(dateOfBirth).slice(0, 10) : "");
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    if (fName.trim() === "") {
      setError("Name cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fName.trim(),
          email: fEmail.trim() === "" ? null : fEmail.trim(),
          phone: fPhone.trim() === "" ? null : fPhone.trim(),
          date_of_birth: fDob.trim() === "" ? null : fDob,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Could not save. Nothing has been changed.");
        setSaving(false);
        return;
      }
      setEditing(false);
      setSaving(false);
      router.refresh();
    } catch {
      setError("Could not save \u2014 check your connection.");
      setSaving(false);
    }
  };

  return (
    <div className="fcard acc-rose">
      <div className="fcard-h">
        Who they are
        {!editing && (
          <button className="btn-link" type="button" onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>
      {editing ? (
        <>
          <div className="fcard-b">
            <div className="frow">
              <span className="fk">Name</span>
              <span className="fv"><input className="fld" value={fName} onChange={(e) => setFName(e.target.value)} /></span>
            </div>
            <div className="frow">
              <span className="fk">Email</span>
              <span className="fv"><input className="fld" type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="Not set" /></span>
            </div>
            <div className="frow">
              <span className="fk">Phone</span>
              <span className="fv"><input className="fld" value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="Not set" /></span>
            </div>
            <div className="frow">
              <span className="fk">Date of birth</span>
              <span className="fv"><input className="fld" type="date" value={fDob} onChange={(e) => setFDob(e.target.value)} /></span>
            </div>
          </div>
          {error && (
            <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)" }}>
              <p className="miss" style={{ margin: 0, color: "var(--status-danger)" }}>{error}</p>
            </div>
          )}
          <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)", display: "flex", gap: 8 }}>
            <button type="button" onClick={cancel} disabled={saving}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--hub-border)] bg-white px-2.5 py-1 min-h-[30px] text-xs font-semibold hover:bg-[var(--hub-hover)] disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-rose text-white px-2.5 py-1 min-h-[30px] text-xs font-semibold hover:bg-rose/90 disabled:opacity-50">
              {saving ? "Saving\u2026" : "Save"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="fcard-b">
            <div className="fgrid">
              <div className="frow"><span className="fk">Name</span><span className="fv">{name}</span></div>
              <div className="frow"><span className="fk">Email</span><span className="fv">{email || <span className="miss" style={{ fontWeight: 400 }}>Not set.</span>}</span></div>
              <div className="frow"><span className="fk">Phone</span><span className="fv">{phone || <span className="miss" style={{ fontWeight: 400 }}>Not set.</span>}</span></div>
              <div className="frow"><span className="fk">Date of birth</span><span className="fv num">{dateOfBirth ? fmtDate(String(dateOfBirth)) : <span className="miss" style={{ fontWeight: 400 }}>Not set.</span>}</span></div>
            </div>
          </div>
          <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)" }}>
            <p className="miss" style={{ margin: 0 }}>
              {!gender ? "No gender on this record." : "Gender on file."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* \u2500\u2500 Editable record card (Profile drawer \u2014 referral source only; client
   number and client-since are derived/assigned, never editable) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

function RecordCard({ clientNumber, clientSince, referralSource }: {
  clientNumber: number;
  clientSince: string | null;
  referralSource: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fReferral, setFReferral] = useState(referralSource ?? "");

  const cancel = () => {
    setFReferral(referralSource ?? "");
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_source: fReferral.trim() === "" ? null : fReferral.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Could not save. Nothing has been changed.");
        setSaving(false);
        return;
      }
      setEditing(false);
      setSaving(false);
      router.refresh();
    } catch {
      setError("Could not save \u2014 check your connection.");
      setSaving(false);
    }
  };

  return (
    <div className="fcard acc-ink">
      <div className="fcard-h">
        Record
        {!editing && (
          <button className="btn-link" type="button" onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>
      <div className="fcard-b">
        <div className="fgrid">
          <div className="frow"><span className="fk">Client number</span><span className="fv num">#{clientNumber ?? "\u2014"}</span></div>
          <div className="frow"><span className="fk">Client since</span><span className="fv num">{fmtDate(clientSince)}</span></div>
          <div className="frow">
            <span className="fk">How they found you</span>
            <span className="fv">
              {editing ? (
                <input className="fld" value={fReferral} onChange={(e) => setFReferral(e.target.value)} placeholder="Not captured" />
              ) : (
                referralSource || <span className="miss" style={{ fontWeight: 400 }}>Not captured.</span>
              )}
            </span>
          </div>
        </div>
      </div>
      {editing && (
        <>
          {error && (
            <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)" }}>
              <p className="miss" style={{ margin: 0, color: "var(--status-danger)" }}>{error}</p>
            </div>
          )}
          <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)", display: "flex", gap: 8 }}>
            <button type="button" onClick={cancel} disabled={saving}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--hub-border)] bg-white px-2.5 py-1 min-h-[30px] text-xs font-semibold hover:bg-[var(--hub-hover)] disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-rose text-white px-2.5 py-1 min-h-[30px] text-xs font-semibold hover:bg-rose/90 disabled:opacity-50">
              {saving ? "Saving\u2026" : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HEALTH — conditions, medications, rules, clearance
   ═══════════════════════════════════════════════════════════════════════════ */

function HealthDrawer({ client, ruleTypesById, gpClearance, medicalClearanceStatus, riskLevel, annualReviewDueDate, clearanceFrom, specialistName, exerciseModifications }: {
  client: any;
  ruleTypesById: Map<string, any>;
  gpClearance: any;
  medicalClearanceStatus: string;
  riskLevel: string;
  annualReviewDueDate: string | null;
  clearanceFrom: string | null;
  specialistName: string | null;
  exerciseModifications: string | null;
}) {
  const p = client.profile;
  const health = p?.health;
  const conditions: string[] = health?.conditions ?? [];
  const medications: any[] = health?.medications ?? [];
  const painPoints: any[] = health?.pain_points ?? [];
  const contraindications: any[] = health?.contraindications ?? [];
  const rules: any[] = p?.programming_adaptations ?? [];

  // GP clearance conflict check: gp_letter_status says one thing, medical_clearance_status another
  const gpConflict = client.gp_letter_status === "not_required" && medicalClearanceStatus === "pending";

  return (
    <DrawerShell id="dw-health" title="Health" subtitle="Body and what it means for training" width="lg">
      {/* GP clearance conflict warning */}
      {gpConflict && (
        <div className="arow" style={{ marginBottom: 12, background: "var(--status-warning-bg)", borderColor: "var(--status-warning-border)" }}>
          <span className="arow-dot warn" />
          <span className="arow-txt">
            GP clearance says <b>Not received</b> and also <b>Not required</b>
            <span className="arow-sub">Two fields disagree. One should go.</span>
          </span>
        </div>
      )}

      {/* Conditions */}
      <div className="fcard acc-rose">
        <div className="fcard-h">Conditions</div>
        <div className="fcard-b pad">
          {conditions.length > 0 ? (
            <div className="tags">
              {conditions.map((c: string, i: number) => (
                <span key={i} className="tag">{c}</span>
              ))}
            </div>
          ) : (
            <p className="miss" style={{ margin: 0 }}>No conditions recorded.</p>
          )}
        </div>
      </div>

      {/* Medication */}
      <div className="fcard acc-rose">
        <div className="fcard-h">Medication</div>
        <div className="fcard-b pad">
          {medications.length > 0 ? (
            <>
              <table className="ptab">
                <thead>
                  <tr><th>Name</th><th>Treats</th><th>Form</th><th>How often</th><th>Since</th></tr>
                </thead>
                <tbody>
                  {medications.map((m: any, i: number) => (
                    <tr key={i}>
                      <td>{m.name}{m.generic_name ? <span className="w"> ({m.generic_name})</span> : null}</td>
                      <td>{m.treats || "\u2014"}</td>
                      <td className="w">{m.form || "Not recorded"}</td>
                      <td className="w">{m.frequency || "Not recorded"}</td>
                      <td className="w">{m.start_date ? fmtShortDate(m.start_date) : "Not recorded"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {medications.some((m: any) => !m.side_effects) && (
                <p className="miss" style={{ margin: "9px 0 0" }}>
                  Side effects have not been filled in for some medications.
                </p>
              )}
            </>
          ) : (
            <p className="miss" style={{ margin: 0 }}>No medications recorded.</p>
          )}
        </div>
      </div>

      {/* Injuries and pain */}
      <div className="fcard acc-rose">
        <div className="fcard-h">Injuries and pain</div>
        <div className="fcard-b pad">
          {painPoints.length > 0 || contraindications.length > 0 ? (
            <div className="tags">
              {painPoints.map((pp: any, i: number) => (
                <span key={`pp-${i}`} className="tag">{pp.body_area ? `${pp.body_area}: ` : ""}{pp.description || pp}</span>
              ))}
              {contraindications.map((c: any, i: number) => (
                <span key={`ci-${i}`} className="tag">{typeof c === "string" ? c : c.description || c}</span>
              ))}
            </div>
          ) : (
            <p className="miss" style={{ margin: 0 }}>No pain points or contraindications recorded.</p>
          )}
        </div>
      </div>

      {/* Training rules — C1a: severity tags per mockup */}
      <div className="fcard acc-amber">
        <div className="fcard-h">What this means for training</div>
        <div className="fcard-b pad">
          {rules.length > 0 ? (
            <div className="space-y-2">
              {rules.map((r: any) => {
                const ruleType = ruleTypesById.get(r.rule_type_id);
                const isHard = r.severity === "hard";
                return (
                  <div key={r.id} className="flex items-start gap-2.5 py-2 px-3 rounded-control border border-[var(--hub-border)] bg-white">
                    <span className="flex-1 text-[13px] text-[var(--color-ink)]">
                      {ruleType?.label ? `${ruleType.label} — ` : ""}{r.detail}
                    </span>
                    <span className={`shrink-0 inline-flex items-center h-[21px] px-2.5 rounded-pill text-[11.5px] font-semibold border ${
                      isHard
                        ? "bg-[var(--status-danger-bg)] text-[var(--status-danger)] border-[var(--status-danger-border)]"
                        : "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-border)]"
                    }`}>
                      {isHard ? "HARD" : "SOFT"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="miss" style={{ margin: 0 }}>No training rules set.</p>
          )}
        </div>
      </div>

      {/* Cleared to train */}
      <ClearedToTrainCard
        clientNumber={client.client_number}
        medicalClearanceStatus={medicalClearanceStatus}
        riskLevel={riskLevel}
        gpLetterStatus={client.gp_letter_status}
        annualReviewDueDate={annualReviewDueDate}
        clearanceFrom={clearanceFrom}
        specialistName={specialistName}
        exerciseModifications={exerciseModifications}
      />

      {/* GP letter dates — live control (reconnect, 5 Sep 2026). The status
          field above is edited by ClearedToTrainCard; this card only adds
          the requested/received dates, which had no editor anywhere in the
          app until now (the two columns were deliberately excluded from the
          PATCH allow-list until a UI actually wrote them — see route.ts). */}
      <div className="fcard acc-teal">
        <div className="fcard-h">GP letter dates</div>
        <div className="fcard-b pad">
          <GpLetterCard
            clientId={client.id}
            gpLetterStatus={client.gp_letter_status}
            requestedDate={client.gp_letter_requested_date ?? null}
            receivedDate={client.gp_letter_received_date ?? null}
          />
        </div>
      </div>
    </DrawerShell>
  );
}

/* \u2500\u2500 Editable "cleared to train" card (Health drawer) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

const MEDICAL_CLEARANCE_OPTIONS = [
  { value: "not_yet_requested", label: "Not yet requested" },
  { value: "pending", label: "Pending" },
  { value: "cleared", label: "Cleared" },
  { value: "not_required", label: "Not required" },
];
const RISK_LEVEL_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const GP_LETTER_OPTIONS = [
  { value: "not_required", label: "Not required" },
  { value: "requested", label: "Requested" },
  { value: "received", label: "Received" },
];

function ClearedToTrainCard({
  clientNumber,
  medicalClearanceStatus,
  riskLevel,
  gpLetterStatus,
  annualReviewDueDate,
  clearanceFrom,
  specialistName,
  exerciseModifications,
}: {
  clientNumber: number;
  medicalClearanceStatus: string;
  riskLevel: string;
  gpLetterStatus: string;
  annualReviewDueDate: string | null;
  clearanceFrom: string | null;
  specialistName: string | null;
  exerciseModifications: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fMedical, setFMedical] = useState(medicalClearanceStatus || "not_yet_requested");
  const [fRisk, setFRisk] = useState(riskLevel || "low");
  const [fGp, setFGp] = useState(gpLetterStatus || "not_required");
  const [fAnnual, setFAnnual] = useState(annualReviewDueDate ? String(annualReviewDueDate).slice(0, 10) : "");
  const [fClearanceFrom, setFClearanceFrom] = useState(clearanceFrom ?? "");
  const [fSpecialist, setFSpecialist] = useState(specialistName ?? "");
  const [fMods, setFMods] = useState(exerciseModifications ?? "");

  const cancel = () => {
    setFMedical(medicalClearanceStatus || "not_yet_requested");
    setFRisk(riskLevel || "low");
    setFGp(gpLetterStatus || "not_required");
    setFAnnual(annualReviewDueDate ? String(annualReviewDueDate).slice(0, 10) : "");
    setFClearanceFrom(clearanceFrom ?? "");
    setFSpecialist(specialistName ?? "");
    setFMods(exerciseModifications ?? "");
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medical_clearance_status: fMedical,
          risk_level: fRisk,
          gp_letter_status: fGp,
          annual_review_due_date: fAnnual.trim() === "" ? null : fAnnual,
          clearance_from: fClearanceFrom.trim() === "" ? null : fClearanceFrom.trim(),
          specialist_name: fSpecialist.trim() === "" ? null : fSpecialist.trim(),
          exercise_modifications: fMods.trim() === "" ? null : fMods.trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Could not save. Nothing has been changed.");
        setSaving(false);
        return;
      }
      setEditing(false);
      setSaving(false);
      router.refresh();
    } catch {
      setError("Could not save \u2014 check your connection.");
      setSaving(false);
    }
  };

  return (
    <div className="fcard acc-teal">
      <div className="fcard-h">
        Cleared to train
        {!editing && (
          <button className="btn-link" type="button" onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>

      {editing ? (
        <>
          <div className="fcard-b">
            <div className="frow">
              <span className="fk">Medical clearance</span>
              <span className="fv">
                <select className="fld" value={fMedical} onChange={(e) => setFMedical(e.target.value)}>
                  {MEDICAL_CLEARANCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </span>
            </div>
            <div className="frow">
              <span className="fk">Risk level</span>
              <span className="fv">
                <select className="fld" value={fRisk} onChange={(e) => setFRisk(e.target.value)}>
                  {RISK_LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </span>
            </div>
            <div className="frow">
              <span className="fk">GP letter</span>
              <span className="fv">
                <select className="fld" value={fGp} onChange={(e) => setFGp(e.target.value)}>
                  {GP_LETTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </span>
            </div>
            <div className="frow">
              <span className="fk">Annual review</span>
              <span className="fv"><input className="fld" type="date" value={fAnnual} onChange={(e) => setFAnnual(e.target.value)} /></span>
            </div>
            <div className="frow">
              <span className="fk">Cleared by</span>
              <span className="fv"><input className="fld" value={fClearanceFrom} onChange={(e) => setFClearanceFrom(e.target.value)} placeholder="e.g. GP" /></span>
            </div>
            <div className="frow">
              <span className="fk">Specialist</span>
              <span className="fv"><input className="fld" value={fSpecialist} onChange={(e) => setFSpecialist(e.target.value)} placeholder="Not set" /></span>
            </div>
            <div className="frow">
              <span className="fk">Modifications</span>
              <span className="fv"><input className="fld" value={fMods} onChange={(e) => setFMods(e.target.value)} placeholder="Not set" /></span>
            </div>
          </div>
          {error && (
            <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)" }}>
              <p className="miss" style={{ margin: 0, color: "var(--status-danger)" }}>{error}</p>
            </div>
          )}
          <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)", display: "flex", gap: 8 }}>
            <button type="button" onClick={cancel} disabled={saving}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--hub-border)] bg-white px-2.5 py-1 min-h-[30px] text-xs font-semibold hover:bg-[var(--hub-hover)] disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-rose text-white px-2.5 py-1 min-h-[30px] text-xs font-semibold hover:bg-rose/90 disabled:opacity-50">
              {saving ? "Saving\u2026" : "Save"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="fcard-b">
            <div className="fgrid">
              <div className="frow"><span className="fk">Medical clearance</span><span className="fv">{medicalClearanceStatus === "cleared" ? "Cleared" : medicalClearanceStatus === "pending" ? "Pending" : medicalClearanceStatus === "not_required" ? "Not required" : "Not yet requested"}</span></div>
              <div className="frow"><span className="fk">Risk level</span><span className="fv">{riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) : "\u2014"}</span></div>
              <div className="frow"><span className="fk">GP letter</span><span className="fv">{gpLetterStatus === "received" ? "Received" : gpLetterStatus === "requested" ? "Requested" : "Not required"}</span></div>
              <div className="frow"><span className="fk">Annual review</span><span className="fv num">{annualReviewDueDate ? "Due " + fmtDate(annualReviewDueDate) : "Not set"}</span></div>
            </div>
          </div>
          {(clearanceFrom || specialistName || exerciseModifications) && (
            <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)" }}>
              {clearanceFrom && <div className="frow"><span className="fk">Cleared by</span><span className="fv">{clearanceFrom}{specialistName ? ` (${specialistName})` : ""}</span></div>}
              {exerciseModifications && <div className="frow"><span className="fk">Modifications</span><span className="fv">{exerciseModifications}</span></div>}
            </div>
          )}
          {!clearanceFrom && !specialistName && !exerciseModifications && (
            <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)" }}>
              <p className="miss" style={{ margin: 0 }}>No GP or specialist named against the clearance.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Editable "how they train" card (Arrangement drawer) — format, session
   length and pace are plain columns and become fields; where/how-often live
   in the nested `profile.logistics` blob (not extended by this lane) and
   stay read-only. ────────────────────────────────────────────────────────── */

const DELIVERY_MODE_OPTIONS = [
  { value: "studio_1to1", label: "Studio 1-to-1" },
  { value: "home_training", label: "Home training" },
];
const PACE_MODE_OPTIONS = [
  { value: "fast", label: "Fast" },
  { value: "medium", label: "Medium" },
  { value: "slow", label: "Slow" },
];

function HowTheyTrainCard({
  clientNumber,
  deliveryMode,
  trainingLocation,
  frequencyLabel,
  sessionDuration,
  paceMode,
}: {
  clientNumber: number;
  deliveryMode: string;
  trainingLocation: string | null;
  frequencyLabel: string | null;
  sessionDuration: number | null;
  paceMode: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fDelivery, setFDelivery] = useState(deliveryMode || "studio_1to1");
  const [fDuration, setFDuration] = useState(sessionDuration == null ? "" : String(sessionDuration));
  const [fPace, setFPace] = useState(paceMode || "medium");

  const cancel = () => {
    setFDelivery(deliveryMode || "studio_1to1");
    setFDuration(sessionDuration == null ? "" : String(sessionDuration));
    setFPace(paceMode || "medium");
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    if (fDuration.trim() !== "" && (Number.isNaN(Number(fDuration)) || Number(fDuration) <= 0)) {
      setError("Session length must be a number of minutes.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_mode: fDelivery,
          session_duration: fDuration.trim() === "" ? null : Number(fDuration),
          pace_mode: fPace,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Could not save. Nothing has been changed.");
        setSaving(false);
        return;
      }
      setEditing(false);
      setSaving(false);
      router.refresh();
    } catch {
      setError("Could not save — check your connection.");
      setSaving(false);
    }
  };

  return (
    <div className="fcard acc-teal">
      <div className="fcard-h">
        How they train
        {!editing && (
          <button className="btn-link" type="button" onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>
      <div className="fcard-b">
        <div className="fgrid">
          <div className="frow">
            <span className="fk">Format</span>
            <span className="fv">
              {editing ? (
                <select className="fld" value={fDelivery} onChange={(e) => setFDelivery(e.target.value)}>
                  {DELIVERY_MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                deliveryMode === "studio_1to1" ? "Studio 1-to-1" : deliveryMode === "home_training" ? "Home training" : deliveryMode || "—"
              )}
            </span>
          </div>
          <div className="frow">
            <span className="fk">Where</span>
            <span className="fv">{trainingLocation === "studio" ? "The studio" : trainingLocation === "home" ? "Home" : trainingLocation || "—"}</span>
          </div>
          <div className="frow">
            <span className="fk">How often</span>
            <span className="fv num">{frequencyLabel || "—"}</span>
          </div>
          <div className="frow">
            <span className="fk">Session length</span>
            <span className="fv num">
              {editing ? (
                <input className="fld" value={fDuration} onChange={(e) => setFDuration(e.target.value)} inputMode="numeric" placeholder="Minutes" />
              ) : (
                sessionDuration ? `${sessionDuration} min` : "—"
              )}
            </span>
          </div>
          <div className="frow">
            <span className="fk">Pace</span>
            <span className="fv">
              {editing ? (
                <select className="fld" value={fPace} onChange={(e) => setFPace(e.target.value)}>
                  {PACE_MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                paceMode ? paceMode.charAt(0).toUpperCase() + paceMode.slice(1) : "—"
              )}
            </span>
          </div>
        </div>
      </div>
      {editing && (
        <>
          {error && (
            <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)" }}>
              <p className="miss" style={{ margin: 0, color: "var(--status-danger)" }}>{error}</p>
            </div>
          )}
          <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)", display: "flex", gap: 8 }}>
            <button type="button" onClick={cancel} disabled={saving}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--hub-border)] bg-white px-2.5 py-1 min-h-[30px] text-xs font-semibold hover:bg-[var(--hub-hover)] disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-rose text-white px-2.5 py-1 min-h-[30px] text-xs font-semibold hover:bg-rose/90 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Editable goals card (Arrangement drawer) — `goals.primary` lives nested
   inside `profile`; the PATCH route was extended (see route.ts) to merge a
   `goals_primary` key into that blob without touching the rest of it. ───── */

function GoalsCard({ clientNumber, primary }: { clientNumber: number; primary: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fPrimary, setFPrimary] = useState(primary ?? "");

  const cancel = () => {
    setFPrimary(primary ?? "");
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals_primary: fPrimary.trim() === "" ? null : fPrimary.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Could not save. Nothing has been changed.");
        setSaving(false);
        return;
      }
      setEditing(false);
      setSaving(false);
      router.refresh();
    } catch {
      setError("Could not save — check your connection.");
      setSaving(false);
    }
  };

  return (
    <div className="fcard acc-teal">
      <div className="fcard-h">
        Goals
        {!editing && (
          <button className="btn-link" type="button" onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>
      <div className="fcard-b">
        {editing ? (
          <div className="frow">
            <span className="fk">Primary</span>
            <span className="fv"><input className="fld" value={fPrimary} onChange={(e) => setFPrimary(e.target.value)} placeholder="Not set" /></span>
          </div>
        ) : primary ? (
          <div className="frow"><span className="fk">Primary</span><span className="fv">{primary}</span></div>
        ) : (
          <p className="miss" style={{ margin: 0 }}>No goals recorded.</p>
        )}
      </div>
      {editing && (
        <>
          {error && (
            <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)" }}>
              <p className="miss" style={{ margin: 0, color: "var(--status-danger)" }}>{error}</p>
            </div>
          )}
          <div className="fcard-b pad" style={{ borderTop: "1px solid var(--hub-border)", display: "flex", gap: 8 }}>
            <button type="button" onClick={cancel} disabled={saving}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--hub-border)] bg-white px-2.5 py-1 min-h-[30px] text-xs font-semibold hover:bg-[var(--hub-hover)] disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-rose text-white px-2.5 py-1 min-h-[30px] text-xs font-semibold hover:bg-rose/90 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ARRANGEMENT — how they train, goals, package, kit
   ═══════════════════════════════════════════════════════════════════════════ */

function ArrangementDrawer({ client, latestBlock, bandSetName, missingBandSet, sessionsRemaining, sessionsUsed, paymentStatus, packageType, clientStatus, blockSessionCountMismatch, unpaidBlocks, countCompletedSessions, blockExpiryDate, clientReviews, baselineUsed, hubUsedCount }: {
  client: any;
  latestBlock: DBBlock | null;
  bandSetName: string | null;
  missingBandSet: boolean;
  sessionsRemaining: number | null;
  sessionsUsed: number | null;
  paymentStatus: string;
  packageType: string | null;
  clientStatus: string;
  blockSessionCountMismatch: boolean;
  unpaidBlocks: string[];
  countCompletedSessions: number;
  blockExpiryDate: string | null;
  clientReviews: any[];
  baselineUsed: number;
  hubUsedCount: number;
}) {
  const p = client.profile;
  const logistics = p?.logistics;
  const goals = p?.goals;
  const equipment: any[] = client.equipment ?? [];

  // "Things to sort" — reuse the same conditions NeedsYouQueue computes
  const thingsToSort: { headline: string; sub?: string }[] = [];

  if (unpaidBlocks.length > 0) {
    thingsToSort.push({ headline: `Unpaid \u2014 ${unpaidBlocks.join(", ")}` });
  }
  if (blockSessionCountMismatch) {
    thingsToSort.push({
      headline: "The two session counts disagree",
      sub: `Typed: ${sessionsUsed ?? 0} used. Counted: ${baselineUsed} before the hub + ${hubUsedCount} in the hub.`,
    });
  }
  if (missingBandSet) {
    thingsToSort.push({ headline: "No band set chosen, and the current block is a band block" });
  }
  if (client.client_rate == null && latestBlock) {
    thingsToSort.push({ headline: "Rate not set on the record" });
  }

  return (
    <DrawerShell id="dw-arrangement" title="Arrangement" subtitle="What you have agreed" width="lg">
      {/* Things to sort */}
      {thingsToSort.length > 0 && (
        <div className="fcard acc-amber">
          <div className="fcard-h">{thingsToSort.length} thing{thingsToSort.length !== 1 ? "s" : ""} to sort</div>
          <div className="fcard-b">
            {thingsToSort.map((item, i) => (
              <div key={i} className="arow" style={{ padding: "10px 0", borderRadius: 0, border: 0, borderBottom: i < thingsToSort.length - 1 ? "1px solid var(--hub-border)" : undefined }}>
                <span className="arow-dot warn" />
                <span className="arow-txt">
                  {item.headline}
                  {item.sub && <span className="arow-sub">{item.sub}</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="fcard-b" style={{ borderTop: "1px solid var(--hub-border)" }}>
            <Link
              href={`/hub/clients/${client.client_number}/edit#sec-logistics`}
              className="inline-flex items-center justify-center rounded-control border border-[var(--hub-field-border)] bg-white px-2.5 py-1 min-h-[30px] text-xs font-semibold text-foreground no-underline hover:bg-[var(--hub-hover)] transition-colors"
            >
              Edit this in Edit client
            </Link>
          </div>
        </div>
      )}

      {/* How they train */}
      <HowTheyTrainCard
        clientNumber={client.client_number}
        deliveryMode={client.delivery_mode}
        trainingLocation={logistics?.training_location ?? null}
        frequencyLabel={logistics?.frequency?.per_unit ? `${logistics.frequency.per_unit} a ${logistics.frequency.unit}` : logistics?.sessions_per_week ? `${logistics.sessions_per_week} a week` : null}
        sessionDuration={client.session_duration ?? null}
        paceMode={client.pace_mode}
      />

      {/* Goals */}
      <GoalsCard clientNumber={client.client_number} primary={goals?.primary ?? null} />

      {/* Package & payments — live control (reconnect, 5 Sep 2026). Replaces
          the inline PackageCard added earlier the same day: that card only
          covered package/rate/expiry/sessions-remaining, where this one is a
          superset (sessions purchased/used, payment method/status, client
          status, referral source too) and was the more complete of the two,
          so it's kept and PackageCard is deleted rather than run alongside
          it. Block expiry is excluded from its edit form on purpose — see
          GracePeriodExtension immediately below, which is the sole editor
          for that field so it stays audited. */}
      <PackagePaymentsCard
        clientId={client.id}
        initial={{
          package_type: packageType,
          sessions_purchased: client.sessions_purchased ?? null,
          sessions_used: sessionsUsed,
          sessions_remaining: sessionsRemaining,
          session_duration: client.session_duration ?? null,
          client_rate: client.client_rate ?? null,
          payment_method: client.payment_method ?? null,
          payment_status: paymentStatus as import("@/types").PaymentStatus,
          client_status: clientStatus as import("@/types").ClientStatus,
          block_expiry_date: blockExpiryDate,
        }}
      />

      {/* Block expiry — the sole editor for block_expiry_date, so grace-period
          extensions stay audited (from/to/reason/when) rather than a plain
          date field anyone could silently overwrite. */}
      <GracePeriodExtension
        clientId={client.id}
        currentExpiry={blockExpiryDate}
        extensions={client.block_expiry_extensions ?? []}
      />

      {/* Kit and reviews */}
      <div className="fcard acc-ink">
        <div className="fcard-h">Kit and reviews</div>
        <div className="fcard-b">
          <div className="frow">
            <span className="fk">Band set</span>
            <span className="fv">
              {bandSetName
                ? bandSetName
                : <span className="miss" style={{ fontWeight: 400 }}>None chosen{missingBandSet ? ", and the current block is a band block" : ""}.</span>}
            </span>
          </div>
          <div className="frow">
            <span className="fk">Equipment</span>
            <span className="fv">
              {equipment.length > 0 ? (
                /* Chips, not a comma list: what she can reach is a set of
                   discrete constraints on what may be prescribed, and it
                   matters most for a home client with no studio rack. */
                <span className="tags">
                  {equipment.map((e: any, i: number) => {
                    const name = typeof e === "string" ? e : e?.name;
                    const detail = typeof e === "string" ? null : e?.detail;
                    if (!name) return null;
                    return (
                      <span key={`${name}-${i}`} className="tag">
                        {name}
                        {detail ? ` · ${detail}` : ""}
                      </span>
                    );
                  })}
                </span>
              ) : (
                <span className="miss" style={{ fontWeight: 400 }}>
                  Nothing listed, so plans are not constrained by what they can reach.
                </span>
              )}
            </span>
          </div>
          <div className="frow">
            <span className="fk">Reviews</span>
            <span className="fv">
              {clientReviews.length > 0
                ? `${clientReviews.length} recorded`
                : <span className="miss" style={{ fontWeight: 400 }}>None recorded.</span>}
            </span>
          </div>
        </div>
      </div>
    </DrawerShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOCUMENTS — one list of paper with compliance summary
   ═══════════════════════════════════════════════════════════════════════════ */

function DocumentsDrawer({ clientNumber, clientDocuments, legacyDocumentRows, flags, gpClearance, annualReviewDueDate, gpLetterStatus }: {
  clientNumber: number;
  clientDocuments: any[];
  legacyDocumentRows: any[];
  flags: ComplianceFlags;
  gpClearance: any;
  annualReviewDueDate: string | null;
  gpLetterStatus: string;
}) {
  const allDocs = [...clientDocuments, ...legacyDocumentRows];
  const signedDocs = allDocs.filter((d) => d.status === "signed");
  const isClear = flags.effectiveStatus === "clear";

  return (
    <DrawerShell id="dw-documents" title="Documents" subtitle={`${allDocs.length} on file \u00b7 ${signedDocs.length} signed`} width="md">
      {/* The drawer listed documents but carried no action at all, and the full
          per-client documents page was unreachable from anywhere in the app.
          Found in the post-update route audit, 5 Sep 2026. */}
      <div className="flex items-center gap-2 flex-wrap pb-3">
        <Link
          href={`/hub/clients/${clientNumber}/documents`}
          className="inline-flex items-center justify-center rounded-control border border-[var(--hub-field-border)] bg-white px-2.5 py-1 min-h-[30px] text-xs font-semibold text-foreground no-underline hover:bg-[var(--hub-hover)] transition-colors"
        >
          Send or manage documents
        </Link>
      </div>
      {/* Cleared to train summary */}
      <div className="fcard acc-teal">
        <div className="fcard-h">Cleared to train</div>
        <div className="fcard-b pad">
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-ink)" }}>
            {isClear
              ? "All required documents are signed and in date."
              : flags.autoOutstanding.length > 0
                ? `${flags.autoOutstanding.length} thing${flags.autoOutstanding.length !== 1 ? "s" : ""} still needed.`
                : "Check the individual documents below for status."}
            {annualReviewDueDate && ` Her annual review is not due until ${fmtDate(annualReviewDueDate)}.`}
          </p>
          {gpClearance && gpLetterStatus === "not_required" && medicalClearanceIsPending(flags) && (
            <p className="miss" style={{ margin: "7px 0 0" }}>
              GP clearance reads both Not received and Not required.
            </p>
          )}
        </div>
      </div>

      <div className="fcard acc-ink">
        <div className="fcard-h">On file</div>
        <div className="fcard-b" style={{ padding: 0 }}>
          {allDocs.length > 0 ? (
            allDocs.map((doc: any) => (
              <Link
                key={doc.id}
                href={`/hub/clients/${clientNumber}/documents/${doc.id}`}
                className="drow no-underline hover:bg-[var(--hub-hover)] transition-colors rounded-nested"
              >
                <span className="drow-m">
                  {doc.title || doc.kind}
                  <small>
                    {doc.status === "signed" ? `Signed${doc.updated_at ? " " + fmtShortDate(doc.updated_at) : doc.created_at ? " " + fmtShortDate(doc.created_at) : ""}` : doc.status}
                    {doc.legacy ? " \u00b7 legacy record" : ""}
                  </small>
                </span>
                <span className={`bdg ${doc.status === "signed" ? "ok" : doc.status === "superseded" ? "mut" : "warn"}`}>
                  {doc.status === "signed" ? "Signed" : doc.status === "superseded" ? "Superseded" : doc.status === "sent" ? "Sent" : "Draft"}
                </span>
              </Link>
            ))
          ) : (
            <p className="miss" style={{ margin: 0, padding: "14px" }}>No documents on file.</p>
          )}
        </div>
      </div>
    </DrawerShell>
  );
}

function medicalClearanceIsPending(flags: ComplianceFlags): boolean {
  return flags.autoOutstanding.some((a) => /gp|clearance/i.test(a));
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMMS — updates, tasks, sent history
   ═══════════════════════════════════════════════════════════════════════════ */

function CommsDrawer({
  clientId,
  clientNumber,
  dueInfo,
  allTaskRows,
  clientUpdates,
  updateInterval,
  updateIntervalWeeks,
  updateIntervalNextDate,
  lastSentAt,
  currentUserName,
}: {
  clientId: string;
  clientNumber: number;
  dueInfo: UpdateDueInfo;
  allTaskRows: any[];
  clientUpdates: any[];
  updateInterval: UpdateInterval | null;
  updateIntervalWeeks: number | null;
  updateIntervalNextDate: string | null;
  lastSentAt: string | null;
  currentUserName: string | null;
}) {
  const sentUpdates = clientUpdates.filter((u) => u.status === "sent" && u.sent_at);

  const tasksPanelRef = useRef<ClientTasksPanelHandle>(null);

  return (
    <DrawerShell id="dw-comms" title="Comms" subtitle="Updates and delivery history" width="md">
      {/* The V3 client record shipped with no way to send an update at all: the
          only "Write an update" action lived in the Needs You queue, gated to
          home-training clients who had gone quiet, so it never appeared for a
          studio client. Raised by Craig, 5 Sep 2026. */}
      <div className="flex items-center gap-2 flex-wrap pb-3">
        <Link
          href={`/hub/clients/${clientNumber}/updates/new`}
          className="inline-flex items-center justify-center rounded-control border border-[var(--hub-field-border)] bg-white px-2.5 py-1 min-h-[30px] text-xs font-semibold text-foreground no-underline hover:bg-[var(--hub-hover)] transition-colors"
        >
          Write an update
        </Link>
        <Link
          href={`/hub/clients/${clientNumber}/updates`}
          className="text-xs font-semibold text-[var(--color-rose)] no-underline hover:underline underline-offset-2"
        >
          See every update sent
        </Link>
      </div>
      <div className="fcard acc-teal">
        <div className="fcard-h">Update cadence</div>
        <div className="fcard-b">
          <UpdateIntervalControl
            clientNumber={clientNumber}
            updateInterval={updateInterval}
            updateIntervalWeeks={updateIntervalWeeks}
            updateIntervalNextDate={updateIntervalNextDate}
            dueInfo={dueInfo}
          />
        </div>
      </div>

      {/* Tasks — live add/complete control, supersedes the old read-only
          task fcard. */}
      <div className="fcard acc-amber">
        <div className="fcard-h">
          <span>Tasks</span>
          <button
            onClick={() => tasksPanelRef.current?.openAddForm()}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[var(--hub-border)] px-2.5 py-1 text-[12px] font-semibold text-foreground hover:bg-[var(--hub-hover)] transition-colors"
          >
            Add task
          </button>
        </div>
        <div className="fcard-b">
          <ClientTasksPanel
            ref={tasksPanelRef}
            clientId={clientId}
            clientNumber={clientNumber}
            updateInterval={updateInterval}
            dueInfo={dueInfo}
            lastSentAt={lastSentAt}
            currentUserName={currentUserName}
          />
        </div>
      </div>

      {/* Recent updates */}
      <div className="fcard acc-ink">
        <div className="fcard-h">Recent updates</div>
        <div className="fcard-b" style={{ padding: "4px 12px" }}>
          {sentUpdates.length > 0 ? (
            sentUpdates.slice(0, 5).map((u: any) => (
              <div key={u.id} className="border-b border-[var(--hub-border)] last:border-b-0 py-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12.5px] font-semibold text-foreground">{fmtShortDate(u.sent_at)}</span>
                  <span className="text-[13px] text-[var(--color-body)]">· {u.subject || "Update"}</span>
                  {/* Emailed vs Logged only badge */}
                  {u.emailed ? (
                    <span className="inline-flex items-center h-[21px] px-2 rounded-pill text-[11.5px] font-semibold bg-[var(--status-success-bg)] text-[var(--teal-text)] border border-[var(--status-success-border)]">
                      Emailed
                    </span>
                  ) : (
                    <span className="inline-flex items-center h-[21px] px-2 rounded-pill text-[11.5px] font-semibold bg-[var(--s-neutral-bg)] text-[var(--color-body)] border border-[var(--s-neutral-border)]">
                      Logged only
                    </span>
                  )}
                </div>
                {/* Engagement summary */}
                <div className="flex items-center gap-2 mt-1 text-[11.5px] text-[var(--color-muted)]">
                  {u.opened_at && (
                    <span className="flex items-center gap-1">
                      Opened
                      {u.open_count > 1 && <span>({u.open_count})</span>}
                    </span>
                  )}
                  {u.click_count > 0 && (
                    <span>{u.click_count} click{u.click_count !== 1 ? "s" : ""}</span>
                  )}
                  {u.status === "failed" && u.send_error && (
                    <span className="text-[var(--status-danger)] truncate max-w-[220px]" title={u.send_error}>
                      Failed: {u.send_error}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="miss" style={{ margin: 0 }}>Nothing sent from the hub yet.</p>
          )}
        </div>
      </div>

      {/* Delivery issues — only if there are failed sends */}
      {sentUpdates.some((u: any) => u.status === "failed" && u.send_error) && (
        <div className="fcard acc-amber">
          <div className="fcard-h">Delivery issues</div>
          <div className="fcard-b" style={{ padding: "4px 12px" }}>
            {sentUpdates.filter((u: any) => u.status === "failed" && u.send_error).slice(0, 3).map((u: any) => (
              <div key={u.id} className="flex gap-3 items-start py-2 border-b border-[var(--hub-border)] last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12.5px] font-semibold text-foreground">{fmtShortDate(u.sent_at || u.created_at)}</span>
                    <span className="text-[13px] text-[var(--color-body)]">· {u.subject || "Update"}</span>
                    <span className="inline-flex items-center h-[21px] px-2 rounded-pill text-[11.5px] font-semibold bg-[var(--s-warning-bg)] text-[var(--amber-text)] border border-[var(--s-warning-border)]">
                      Failed
                    </span>
                  </div>
                  <div className="text-[12.5px] text-[var(--color-body)] mt-1 leading-snug">{u.send_error}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DrawerShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WORKOUT — one session's exercises (opened from block map or block drawer)
   ═══════════════════════════════════════════════════════════════════════════ */

function WorkoutDrawer({ sessions, ruleTypesById }: { sessions: DBSession[]; ruleTypesById: Map<string, any> }) {
  const { selectedSessionId, parentId } = useDrawerManager();
  const session = sessions.find((s) => s.id === selectedSessionId);

  if (!session) {
    return (
      <DrawerShell id="dw-workout" title="Workout" subtitle="Session exercises" width="lg">
        <p className="miss">Select a session to view its exercises.</p>
      </DrawerShell>
    );
  }

  const data = session.data;
  const version = data?.versions?.studio ?? data?.versions?.home;
  const focusLabel = sessionWorkoutName(session, `Session ${session.session_number}`);
  const blockNumber = (session as any).blocks?.block_number;
  const sessionNumber = session.session_number;

  const hasExercises = version && (
    (version.warm_up?.length ?? 0) > 0 ||
    (version.main_block?.length ?? 0) > 0 ||
    (version.cooldown?.length ?? 0) > 0
  );

  return (
    <DrawerShell
      id="dw-workout"
      title={focusLabel}
      subtitle={`Block ${blockNumber ?? "\u2014"} \u00b7 session ${sessionNumber ?? "\u2014"}`}
      width="lg"
    >
      {hasExercises && version ? (
        <PrescriptionTable version={version} />
      ) : (
        <p className="miss">No exercises assigned to this session yet.</p>
      )}
    </DrawerShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROGRESS — the REVIEW rung: how it's going, session log, PBs, attendance,
   programme reviews. Rebuilt to training-progress-drawer-v1.html (CR-EF-186).
   ═══════════════════════════════════════════════════════════════════════════ */

function ProgressDrawer({ exerciseTrends, exerciseTrendSummary, sessions, blocks, clientNumber, client }: {
  exerciseTrends: ExerciseTrend[];
  exerciseTrendSummary?: {
    totalExercisesLogged: number;
    personalBests: number;
    heaviestLift: string | null;
    belowBestCount: number;
    recentNotes: string | null;
  };
  sessions: DBSession[];
  blocks: DBBlock[];
  clientNumber: number;
  client: any;
}) {
  const { closeDrawer } = useDrawerManager();
  // ── Shared: main sessions only (exclude sub-sessions, Outlook placeholders, Trainerize imports) ──
  const mainSessions = sessions.filter(
    (s) => !s.parent_session_id && !isOutlookPlaceholder(s) && !isTrainerizeImported(s),
  );

  // ── Completed sessions (status or completed_at) ──
  const completedSessions = mainSessions.filter(
    (s) => s.status === "completed" || s.completed_at,
  );

  // ── Set logs per session (from exercise trends — each point is one session's logs) ──
  const sessionSetCounts = new Map<string, number>();
  for (const s of completedSessions) {
    let count = 0;
    for (const trend of exerciseTrends) {
      for (const pt of trend.points) {
        if (pt.loggedAt && s.completed_at) {
          const ptDate = new Date(pt.loggedAt).getTime();
          const sDate = new Date(s.completed_at).getTime();
          if (Math.abs(ptDate - sDate) < 86_400_000) {
            count += pt.completedSets;
          }
        }
      }
    }
    sessionSetCounts.set(s.id, count);
  }

  // ── 1. How it's going ──
  const sessionsCompleted = completedSessions.length;
  // Attendance denominator: only resolved sessions (completed + cancelled), not future/planned
  const resolvedSessions = mainSessions.filter(
    (s) => s.status === "completed" || s.completed_at || s.status === "cancelled",
  );
  const totalResolved = resolvedSessions.length;
  const attendanceRate = totalResolved > 0 ? Math.round((sessionsCompleted / totalResolved) * 100) : null;
  // Real set count from exercise trends
  const totalSetsLogged = exerciseTrends.reduce(
    (sum, trend) => sum + trend.points.reduce((s, pt) => s + (pt.completedSets ?? 0), 0),
    0,
  );
  const sessionsWithNoLog = completedSessions.filter(
    (s) => (sessionSetCounts.get(s.id) ?? 0) === 0,
  ).length;
  const oldestNoLog = completedSessions
    .filter((s) => (sessionSetCounts.get(s.id) ?? 0) === 0)
    .sort((a, b) => new Date(a.completed_at ?? a.scheduled_at ?? "").getTime() - new Date(b.completed_at ?? b.scheduled_at ?? "").getTime())[0];
  const programmeCount = blocks.length;
  const firstDate = completedSessions.length > 0
    ? completedSessions
        .map((s) => s.completed_at ?? s.scheduled_at ?? "")
        .filter(Boolean)
        .sort()[0]
    : null;

  // ── 2. Session log (completed, newest first) ──
  const logSessions = [...completedSessions].sort(
    (a, b) => new Date(b.completed_at ?? b.scheduled_at ?? "").getTime() - new Date(a.completed_at ?? a.scheduled_at ?? "").getTime(),
  );
  const LOG_INITIAL_COUNT = 5;
  const [showAllLog, setShowAllLog] = useState(false);
  const visibleLogSessions = showAllLog ? logSessions : logSessions.slice(0, LOG_INITIAL_COUNT);

  // ── 3. Personal bests ──
  const pbRows = exerciseTrends
    .filter((t) => t.points && t.points.length > 0)
    .map((trend) => {
      const pts = trend.points;
      const last = pts[pts.length - 1];
      let best = last;
      let first = pts[0];
      for (const p of pts) {
        if (trend.metric === "weight" && (p.topWeightKg ?? 0) > (best.topWeightKg ?? 0)) best = p;
        else if (trend.metric === "reps" && (p.maxReps ?? 0) > (best.maxReps ?? 0)) best = p;
        else if (trend.metric === "duration" && (p.maxDurationSeconds ?? 0) > (best.maxDurationSeconds ?? 0)) best = p;
      }
      const formatValue = (pt: any) => {
        if (trend.metric === "weight" && pt.topWeightKg != null) return `${pt.topWeightKg} kg`;
        if (trend.metric === "reps" && pt.maxReps != null) return `${pt.maxReps} reps`;
        if (trend.metric === "duration" && pt.maxDurationSeconds != null) return `${Math.round(pt.maxDurationSeconds)}s`;
        return "\u2014";
      };
      const currentValue = formatValue(best);
      const firstValue = formatValue(first);
      let delta: string | null = null;
      let isFlat = false;
      if (trend.metric === "weight" && first.topWeightKg != null && best.topWeightKg != null) {
        const diff = best.topWeightKg - first.topWeightKg;
        if (diff === 0) { delta = "no change"; isFlat = true; } else delta = diff > 0 ? `+${diff} kg` : `${diff} kg`;
      } else if (trend.metric === "reps" && first.maxReps != null && best.maxReps != null) {
        const diff = best.maxReps - first.maxReps;
        if (diff === 0) { delta = "no change"; isFlat = true; } else delta = diff > 0 ? `+${diff} reps` : `${diff} reps`;
      } else if (trend.metric === "duration" && first.maxDurationSeconds != null && best.maxDurationSeconds != null) {
        const diff = Math.round(best.maxDurationSeconds - first.maxDurationSeconds);
        if (diff === 0) { delta = "no change"; isFlat = true; } else delta = diff > 0 ? `+${diff}s` : `${diff}s`;
      }
      const setWhen = fmtShortDate(best.loggedAt);
      const wasWhat = first !== best ? `${firstValue} on ${fmtShortDate(first.loggedAt)}` : null;
      const subtitle = wasWhat ? `Set ${setWhen} \u00b7 was ${wasWhat}` : `Set ${setWhen}`;
      return { name: trend.exerciseName, value: currentValue, subtitle, delta, isFlat };
    })
    .filter((r) => r.delta !== null);

  // ── 3b. Load progression rows (last / best / trend) ──
  const loadRows = exerciseTrends
    .filter((t) => t.points && t.points.length > 0)
    .map((trend) => {
      const pts = trend.points;
      const last = pts[pts.length - 1];
      let best = last;
      for (const p of pts) {
        if (trend.metric === "weight" && (p.topWeightKg ?? 0) > (best.topWeightKg ?? 0)) best = p;
        else if (trend.metric === "reps" && (p.maxReps ?? 0) > (best.maxReps ?? 0)) best = p;
        else if (trend.metric === "duration" && (p.maxDurationSeconds ?? 0) > (best.maxDurationSeconds ?? 0)) best = p;
      }
      const formatValue = (pt: any) => {
        if (trend.metric === "weight" && pt.topWeightKg != null) return `${pt.topWeightKg} kg`;
        if (trend.metric === "reps" && pt.maxReps != null) return `${pt.maxReps} reps`;
        if (trend.metric === "duration" && pt.maxDurationSeconds != null) return `${Math.round(pt.maxDurationSeconds)}s`;
        return "\u2014";
      };
      let trendDir: "up" | "flat" | "down" = "flat";
      if (pts.length >= 2) {
        const prev = pts[pts.length - 2];
        if (trend.metric === "weight") {
          trendDir = (last.topWeightKg ?? 0) > (prev.topWeightKg ?? 0) ? "up" : (last.topWeightKg ?? 0) < (prev.topWeightKg ?? 0) ? "down" : "flat";
        } else if (trend.metric === "reps") {
          trendDir = (last.maxReps ?? 0) > (prev.maxReps ?? 0) ? "up" : (last.maxReps ?? 0) < (prev.maxReps ?? 0) ? "down" : "flat";
        } else if (trend.metric === "duration") {
          trendDir = (last.maxDurationSeconds ?? 0) > (prev.maxDurationSeconds ?? 0) ? "up" : (last.maxDurationSeconds ?? 0) < (prev.maxDurationSeconds ?? 0) ? "down" : "flat";
        }
      }
      return {
        name: trend.exerciseName,
        lastValue: formatValue(last),
        bestValue: formatValue(best),
        isBest: last === best || (trend.metric === "weight" && last.topWeightKg === best.topWeightKg && last.repsAtTopWeight === best.repsAtTopWeight),
        trendDir,
        lastDate: fmtShortDate(last.loggedAt),
      };
    }).filter(Boolean);

  // ── 3c. RPE mini-trend ──
  const rpeData = sessions
    .filter((s: any) => s.data?.session_log?.rpe != null && s.status === "completed")
    .sort((a: any, b: any) => {
      const aDate = a.data?.session_log?.completed_at ?? a.scheduled_at ?? "";
      const bDate = b.data?.session_log?.completed_at ?? b.scheduled_at ?? "";
      return aDate.localeCompare(bDate);
    })
    .slice(-8)
    .map((s: any) => ({
      rpe: s.data.session_log.rpe as number,
      date: fmtShortDate(s.data?.session_log?.completed_at ?? s.scheduled_at),
    }));

  const rpeColor = (rpe: number) =>
    rpe <= 4 ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)]"
    : rpe <= 7 ? "bg-[var(--status-warning-bg)] text-[var(--amber-text)]"
    : "bg-[var(--status-primary-bg)] text-[var(--rose-text)]";

  // ── 3d. Physical baseline + goals ──
  const profile = client?.profile as Record<string, any> | undefined;
  const baseline = profile?.physical_baseline as Record<string, any> | undefined;
  const goals = profile?.goals as Record<string, any> | undefined;
  const milestones = Array.isArray(goals?.milestones) ? goals.milestones : [];
  const hasBaseline = baseline && (baseline.fitness_level || baseline.strength_baseline);

  // ── 4. Attendance ──
  const cancelledNotCharged = mainSessions.filter(
    (s) => s.status === "cancelled" && (s.charged_free === "free" || s.charged_free == null),
  ).length;
  const cancelledCharged = mainSessions.filter(
    (s) => s.status === "cancelled" && s.charged_free === "charged",
  ).length;

  // ── 5. Programme reviews ──
  const sortedBlocks = [...blocks].sort((a, b) => b.block_number - a.block_number);

  // PB entry form state
  const [showPbForm, setShowPbForm] = useState(false);
  const [pbExercise, setPbExercise] = useState("");
  const [pbValue, setPbValue] = useState("");
  const [pbReps, setPbReps] = useState("");
  const [pbDate, setPbDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pbNote, setPbNote] = useState("");
  const [pbSaving, setPbSaving] = useState(false);

  const uniqueExercises = [...new Set(exerciseTrends.map((t) => t.exerciseName))].sort();

  const savePB = async () => {
    if (!pbExercise || !pbValue || !pbReps) return;
    setPbSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientNumber}/personal-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: pbExercise,
          unit: "kg",
          value: parseFloat(pbValue),
          reps: parseInt(pbReps, 10),
          achieved_at: pbDate,
          note: pbNote || undefined,
        }),
      });
      if (res.ok) {
        setPbExercise("");
        setPbValue("");
        setPbReps("");
        setPbNote("");
        setShowPbForm(false);
      }
    } finally {
      setPbSaving(false);
    }
  };

  const programmeLabel = client?.profile?.goals?.primary ?? "programme";

  return (
    <DrawerShell
      id="dw-progress"
      title="Progress"
      subtitle={`${client?.name ?? ""} \u00b7 ${programmeLabel} \u00b7 ${sessionsCompleted} sessions completed`}
      width="lg"
      footer={
        <>
          <button
            type="button"
            onClick={closeDrawer}
            className="inline-flex items-center gap-1.5 rounded-lg border-0 bg-transparent px-3 py-1.5 min-h-[30px] font-[inherit] text-[12.5px] font-medium text-[var(--color-body)] cursor-pointer hover:bg-[var(--hub-hover)] transition-colors"
          >
            Close
          </button>
          <span className="flex-1" />
          {sortedBlocks.length > 0 && (
            <button
              type="button"
              onClick={() => {
                window.location.href = `/hub/clients/${clientNumber}/updates/block-review/${sortedBlocks[0].id}`;
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-rose)] text-white px-4 py-1.5 min-h-[30px] font-[inherit] text-[12.5px] font-semibold cursor-pointer hover:bg-[var(--color-rose)]/90 transition-colors"
            >
              Write a review
            </button>
          )}
        </>
      }
    >
      {/* 1 ── How it is going */}
      <div className="fcard acc-teal">
        <div className="fcard-h">
          How it is going
          <span className="sub">
            {firstDate ? `Since ${fmtShortDate(firstDate)}` : "No sessions yet"}
            {programmeCount > 0 && ` \u00b7 ${programmeCount} programme${programmeCount !== 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="fcard-b">
          <div className="att">
            <span>Sessions completed<b>{sessionsCompleted}</b></span>
            {attendanceRate !== null && <span>Attendance<b className={attendanceRate >= 80 ? "up" : ""}>{attendanceRate}%</b></span>}
            <span>Sets logged<b>{totalSetsLogged}</b></span>
            {sessionsWithNoLog > 0 && <span>Sessions with no log<b className="warn">{sessionsWithNoLog}</b></span>}
          </div>
          {sessionsWithNoLog > 0 && (
            <p className="miss" style={{ marginTop: 12 }}>
              <b style={{ color: "var(--amber-text)" }}>
                {sessionsWithNoLog} completed session{sessionsWithNoLog !== 1 ? "s" : ""} {sessionsWithNoLog !== 1 ? "have" : "has"} no sets recorded.
              </b>
              {" "}Nothing can be reviewed from {sessionsWithNoLog !== 1 ? "them" : "it"} and {sessionsWithNoLog !== 1 ? "they do" : "it does"} not count towards a personal best
              {oldestNoLog && ` \u2014 the oldest is ${fmtShortDate(oldestNoLog.completed_at ?? oldestNoLog.scheduled_at ?? "")}`}.
            </p>
          )}
        </div>
      </div>

      {/* 2 ── Session log */}
      <div className="fcard acc-ink">
        <div className="fcard-h">
          Session log
          <span className="sub">{sessionsCompleted} completed \u00b7 newest first</span>
        </div>
        <div className="fcard-b">
          {visibleLogSessions.length > 0 ? (
            <>
              {visibleLogSessions.map((s) => {
                const setCount = sessionSetCounts.get(s.id) ?? 0;
                const hasLog = setCount > 0;
                const rpe = (s as any).data?.session_log?.rpe;
                const workoutName = sessionWorkoutName(s);
                const posLabel = s.session_number != null ? `Position ${s.session_number}` : "";
                const duration = (s as any).data?.session_log?.duration_minutes;
                const metaParts = [posLabel, duration ? `${duration} min` : null, rpe != null ? `RPE ${rpe}` : null].filter(Boolean);

                return (
                  <div key={s.id} className="lrow2">
                    <span className="lrow2-d">{fmtShortDate(s.completed_at ?? s.scheduled_at ?? "")}</span>
                    <span className="lrow2-m">
                      <span className="lrow2-t">{workoutName}</span>
                      <span className="lrow2-s">
                        {metaParts.length > 0 ? metaParts.join(" \u00b7 ") : "Marked complete on the day"}
                      </span>
                    </span>
                    <span className={`lrow2-n${hasLog ? "" : " none"}`}>
                      <b>{setCount}</b> <small>sets</small>
                    </span>
                    <span className="lrow2-a">
                      {hasLog ? (
                        <Link
                          href={`/hub/sessions/${s.id}`}
                          className="inline-flex items-center justify-center h-[var(--h-control-sm)] px-2.5 rounded-control-sm border-0 bg-transparent text-[var(--color-body)] text-[12.5px] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--hub-hover)] hover:text-[var(--color-ink)] transition-colors"
                        >
                          Open
                        </Link>
                      ) : (
                        <Link
                          href={`/hub/sessions/${s.id}`}
                          className="inline-flex items-center justify-center h-[var(--h-control-sm)] px-2.5 rounded-control-sm border border-[var(--hub-border)] bg-white text-[var(--color-body)] text-[12.5px] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--hub-hover)] hover:border-[var(--hub-field-border)] transition-colors"
                        >
                          Log the sets
                        </Link>
                      )}
                    </span>
                  </div>
                );
              })}
              {logSessions.length > LOG_INITIAL_COUNT && !showAllLog && (
                <button
                  type="button"
                  onClick={() => setShowAllLog(true)}
                  className="inline-flex items-center justify-center h-8 px-2.5 rounded-control-sm border-0 bg-transparent text-[var(--color-body)] text-[12.5px] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--hub-hover)] hover:text-[var(--color-ink)] transition-colors mt-2.5"
                >
                  Show all {logSessions.length}
                </button>
              )}
            </>
          ) : (
            <p className="miss" style={{ margin: 0 }}>No completed sessions yet.</p>
          )}
        </div>
      </div>

      {/* 3 ── Personal bests */}
      <div className="fcard acc-teal">
        <div className="fcard-h">
          Personal bests
          <span className="sub">{pbRows.length} lift{pbRows.length !== 1 ? "s" : ""} tracked{firstDate ? ` \u00b7 since ${fmtShortDate(firstDate)}` : ""}</span>
          <button type="button" className="btn-link" onClick={() => setShowPbForm(!showPbForm)}>
            {showPbForm ? "Cancel" : "Add one by hand"}
          </button>
        </div>
        <div className="fcard-b">
          {pbRows.length > 0 ? (
            pbRows.map((pb, i) => (
              <div key={i} className="pb-row">
                <span className="pb-row-m">
                  <span className="pb-row-t">{pb.name}</span>
                  <span className="pb-row-s">{pb.subtitle}</span>
                </span>
                <span className="pb-row-v">{pb.value}</span>
                <span className={`pb-row-d${pb.isFlat ? " flat" : ""}`}>{pb.delta}</span>
              </div>
            ))
          ) : (
            <p className="miss" style={{ margin: 0 }}>No personal bests recorded yet. As exercises are logged, the best values appear here.</p>
          )}

          {showPbForm && (
            <div style={{ marginTop: 14, padding: 12, border: "1px solid var(--hub-border)", borderRadius: "var(--r-nested)", background: "var(--hub-hover)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 100px", gap: 8, alignItems: "end" }}>
                <div>
                  <label className="lbl">Exercise</label>
                  <select className="fld" value={pbExercise} onChange={(e) => setPbExercise(e.target.value)}>
                    <option value="">Select\u2026</option>
                    {uniqueExercises.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="lbl">Value (kg)</label>
                  <input className="fld" type="text" placeholder="65" value={pbValue} onChange={(e) => setPbValue(e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Reps</label>
                  <input className="fld" type="text" placeholder="8" value={pbReps} onChange={(e) => setPbReps(e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Date</label>
                  <input className="fld" type="date" value={pbDate} onChange={(e) => setPbDate(e.target.value)} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="lbl">Note</label>
                  <textarea className="fld" placeholder="e.g. felt strong, good depth" value={pbNote} onChange={(e) => setPbNote(e.target.value)} style={{ height: 48 }} />
                </div>
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={savePB}
                  disabled={pbSaving || !pbExercise || !pbValue || !pbReps}
                  className="inline-flex items-center h-[var(--h-control-sm)] px-3 rounded-control-sm bg-[var(--color-rose)] text-white text-xs font-semibold border-0 cursor-pointer font-[inherit] hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {pbSaving ? "Saving\u2026" : "Save PB"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3b ── Load progression */}
      {loadRows.length > 0 && (
        <div className="fcard acc-teal">
          <div className="fcard-h">Load progression</div>
          <div className="fcard-b" style={{ padding: 0 }}>
            <div className="ptab-wrap">
              <table className="ptab">
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th>Last</th>
                    <th>Best</th>
                    <th>Trend</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loadRows.map((row, i) => (
                    <tr key={i}>
                      <td>{row!.name}</td>
                      <td className="n">{row!.lastValue}</td>
                      <td className="n">
                        {row!.bestValue}
                        {row!.isBest && <span className="pb ml-1.5">PB</span>}
                      </td>
                      <td>
                        <span className={`trend ${row!.trendDir}`}>
                          {row!.trendDir === "up" ? "\u2191" : row!.trendDir === "down" ? "\u2193" : "\u2192"}
                        </span>
                      </td>
                      <td className="n w">{row!.lastDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3c ── Session RPE */}
      <div className="fcard">
        <div className="fcard-h">Session RPE</div>
        <div className="fcard-b">
          {rpeData.length > 0 ? (
            <>
              <div className="rpe-row">
                {rpeData.map((d, i) => (
                  <div key={i} className="rpe-cell">
                    <div className={`rpe-box ${rpeColor(d.rpe)}`}>{d.rpe}</div>
                    <span className="rpe-date">{d.date}</span>
                  </div>
                ))}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--muted)" }}>
                Session effort on a 1\u201310 scale.
              </p>
            </>
          ) : (
            <p className="miss" style={{ margin: 0 }}>
              No session RPE recorded yet. RPE is logged when a session is completed in the trainer hub or client portal.
            </p>
          )}
        </div>
      </div>

      {/* 3d ── Baseline & goals */}
      <div className="fcard acc-rose">
        <div className="fcard-h">Baseline &amp; goals</div>
        <div className="fcard-b">
          {hasBaseline ? (
            <>
              <div className="bl-row">
                <span className="bl-k">Fitness level</span>
                <span className="bl-v">{baseline.fitness_level ?? "\u2014"} / 5</span>
              </div>
              {baseline.strength_baseline && (
                <>
                  <div className="bl-row">
                    <span className="bl-k">Lower body</span>
                    <span className="bl-v">{baseline.strength_baseline.lower_body ?? "\u2014"}</span>
                  </div>
                  <div className="bl-row">
                    <span className="bl-k">Upper body</span>
                    <span className="bl-v">{baseline.strength_baseline.upper_body ?? "\u2014"}</span>
                  </div>
                  <div className="bl-row">
                    <span className="bl-k">Core</span>
                    <span className="bl-v">{baseline.strength_baseline.core ?? "\u2014"}</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="miss">
              No baseline recorded \u00b7 <Link href={`/hub/clients/${clientNumber}/edit`} className="text-[var(--color-rose)] hover:underline">Add on Edit</Link>
            </div>
          )}
        </div>
      </div>

      <div className="fcard acc-rose">
        <div className="fcard-h">Goal milestones</div>
        <div className="fcard-b">
          {milestones.length > 0 ? (
            milestones.map((m: string, i: number) => (
              <div key={i} className="goal-row">
                <span className="goal-icon">{m.charAt(0).toUpperCase()}</span>
                {m}
              </div>
            ))
          ) : (
            <div className="miss">
              No milestones set \u00b7 <Link href={`/hub/clients/${clientNumber}/edit`} className="text-[var(--color-rose)] hover:underline">Add on Edit</Link>
            </div>
          )}
        </div>
      </div>

      {/* 4 ── Attendance */}
      <div className="fcard acc-ink">
        <div className="fcard-h">
          Attendance
          <span className="sub">Across {totalResolved} resolved session{totalResolved !== 1 ? "s" : ""}</span>
        </div>
        <div className="fcard-b">
          <div className="att">
            <span>Completed<b>{sessionsCompleted}</b></span>
            <span>Cancelled, not charged<b>{cancelledNotCharged}</b></span>
            <span>Cancelled, charged<b>{cancelledCharged}</b></span>
          </div>
          <p className="miss" style={{ marginTop: 12 }}>
            Only the {sessionsCompleted} completed took a session from the pot. The free cancellation{cancelledNotCharged !== 1 ? "s" : ""} took none \u2014 the rule is unchanged.
          </p>
        </div>
      </div>

      {/* 5 ── Programme reviews */}
      <div className="fcard acc-ink">
        <div className="fcard-h">
          Programme reviews
          <span className="sub">Written at the end of a programme</span>
        </div>
        <div className="fcard-b">
          {sortedBlocks.length > 0 ? (
            sortedBlocks.map((block) => {
              const blockSessionsForCount = sessions.filter(
                (s) => s.block_id === block.id && !s.parent_session_id,
              );
              const completedInBlock = blockSessionsForCount.filter(
                (s) => s.status === "completed" || s.completed_at,
              ).length;
              const totalInBlock = blockSessionsForCount.length;
              const isCurrent = block.id === client?.block_id;

              return (
                <div key={block.id} className="hrow2">
                  <span className="hrow2-t">{block.block_number}</span>
                  <span className="hrow2-m">
                    <span className="hrow2-n">{block.title || `Block ${block.block_number}`}</span>
                    <span className="hrow2-s">
                      {isCurrent ? "Current" : "Complete"} \u00b7 {completedInBlock} of {totalInBlock}
                    </span>
                  </span>
                  <span className="hrow2-a">
                    <Link
                      href={`/hub/clients/${clientNumber}/updates/block-review/${block.id}`}
                      className="inline-flex items-center justify-center h-[var(--h-control-sm)] px-2.5 rounded-control-sm border border-[var(--hub-border)] bg-white text-[var(--color-body)] text-[12.5px] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--hub-hover)] hover:border-[var(--hub-field-border)] transition-colors"
                    >
                      Open review
                    </Link>
                  </span>
                </div>
              );
            })
          ) : (
            <p className="miss" style={{ margin: 0 }}>No programmes yet. A review is the written answer to "did that programme work". It goes into the client update, so it is worth writing before the next one starts.</p>
          )}
        </div>
      </div>
    </DrawerShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   C1a — POT LEDGER DRAWER
   ═══════════════════════════════════════════════════════════════════════════ */

function PotLedgerDrawer({ clientNumber, clientName }: { clientNumber: number; clientName: string }) {
  return (
    <DrawerShell id="dw-pot-ledger" title="Session balance" subtitle={`${clientName} — paid sessions in and out`} width="lg">
      <PotLedger clientNumber={clientNumber} clientName={clientName} />
    </DrawerShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export function ClientDrawers(props: ClientDrawersProps) {
  return (
    <>
      <ProfileDrawer
        client={props.client}
        portalAccount={props.portalAccount}
        clientNotes={props.clientNotes}
        sessionNotes={props.sessionNotes}
        exerciseNotes={props.exerciseNotes}
        pinnedNoteRefs={props.pinnedNoteRefs}
      />
      <HealthDrawer
        client={props.client}
        ruleTypesById={props.ruleTypesById}
        gpClearance={props.gpClearance}
        medicalClearanceStatus={props.medicalClearanceStatus}
        riskLevel={props.riskLevel}
        annualReviewDueDate={props.annualReviewDueDate}
        clearanceFrom={props.clearanceFrom}
        specialistName={props.specialistName}
        exerciseModifications={props.exerciseModifications}
      />
      <ArrangementDrawer
        client={props.client}
        latestBlock={props.latestBlock}
        bandSetName={props.bandSetName}
        missingBandSet={props.missingBandSet}
        sessionsRemaining={props.sessionsRemaining}
        sessionsUsed={props.sessionsUsed}
        paymentStatus={props.paymentStatus}
        packageType={props.packageType}
        clientStatus={props.clientStatus}
        blockSessionCountMismatch={props.blockSessionCountMismatch}
        unpaidBlocks={props.unpaidBlocks}
        countCompletedSessions={props.countCompletedSessions}
        blockExpiryDate={props.blockExpiryDate}
        clientReviews={props.clientReviews}
        baselineUsed={props.baselineUsed}
        hubUsedCount={props.hubUsedCount}
      />
      <DocumentsDrawer
        clientNumber={props.client.client_number}
        clientDocuments={props.clientDocuments}
        legacyDocumentRows={props.legacyDocumentRows}
        flags={props.flags}
        gpClearance={props.gpClearance}
        annualReviewDueDate={props.annualReviewDueDate}
        gpLetterStatus={props.client.gp_letter_status}
      />
      <CommsDrawer
        clientId={props.clientId}
        clientNumber={props.client.client_number}
        dueInfo={props.dueInfo}
        allTaskRows={props.allTaskRows}
        clientUpdates={props.clientUpdates}
        updateInterval={props.updateInterval}
        updateIntervalWeeks={props.updateIntervalWeeks}
        updateIntervalNextDate={props.updateIntervalNextDate}
        lastSentAt={props.lastSentAt}
        currentUserName={props.currentUserName}
      />
      <WorkoutDrawer
        sessions={props.sessions}
        ruleTypesById={props.ruleTypesById}
      />
      <ProgressDrawer
        exerciseTrends={props.exerciseTrends}
        exerciseTrendSummary={props.exerciseTrendSummary}
        sessions={props.sessions}
        blocks={props.blocks}
        clientNumber={props.client.client_number}
        client={props.client}
      />
      {/* C1a — Pot ledger drawer */}
      <PotLedgerDrawer
        clientNumber={props.client.client_number}
        clientName={props.client.name}
      />
    </>
  );
}
