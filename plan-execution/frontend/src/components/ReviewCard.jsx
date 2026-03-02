import { useState } from 'react'
import styles from './ReviewCard.module.css'

export default function ReviewCard({ data, onDecision }) {
  const [draft, setDraft] = useState(data.draft_response ?? '')
  const [decided, setDecided] = useState(false)
  const [decision, setDecision] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function decide(approved) {
    setSubmitting(true)
    setDecision(approved ? 'approved' : 'rejected')
    setDecided(true)
    await onDecision({ approved, edited_response: approved ? draft : undefined })
    setSubmitting(false)
  }

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <span className={styles.warningIcon}>⚠</span>
        <div>
          <div className={styles.title}>Human Review Required</div>
          <div className={styles.subtitle}>Please review this draft before it is sent to the customer.</div>
        </div>
      </div>

      {/* Meta badges */}
      <div className={styles.meta}>
        {data.intent  && <Badge label={`Intent: ${data.intent}`}   variant={intentVariant(data.intent)} />}
        {data.urgency && <Badge label={`Urgency: ${data.urgency}`} variant={urgencyVariant(data.urgency)} />}
        {data.email_id && <span className={styles.emailId}>{data.email_id}</span>}
      </div>

      {/* Original email */}
      {data.original_email && (
        <section className={styles.section}>
          <div className={styles.sectionLabel}>Customer Email</div>
          <div className={styles.emailBox}>{data.original_email}</div>
        </section>
      )}

      {/* Editable draft */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>
          Draft Response
          {!decided && <span className={styles.editHint}> — edit if needed</span>}
        </div>
        <textarea
          className={styles.textarea}
          rows={7}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          disabled={decided}
        />
      </section>

      {/* Actions */}
      {!decided ? (
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnApprove}`}
            onClick={() => decide(true)}
            disabled={submitting || !draft.trim()}
          >
            ✓ Approve &amp; Send
          </button>
          <button
            className={`${styles.btn} ${styles.btnReject}`}
            onClick={() => decide(false)}
            disabled={submitting}
          >
            ✕ Reject — Handle Manually
          </button>
        </div>
      ) : (
        <div className={`${styles.verdict} ${decision === 'approved' ? styles.verdictApproved : styles.verdictRejected}`}>
          {decision === 'approved' ? '✓ Approved — sending response…' : '✕ Rejected — a human agent will take over.'}
        </div>
      )}
    </div>
  )
}

function Badge({ label, variant }) {
  return <span className={`${styles.badge} ${styles[`v_${variant}`]}`}>{label}</span>
}

function intentVariant(i) {
  return { billing: 'red', bug: 'orange', question: 'blue', feature: 'purple', complex: 'purple' }[i] ?? 'blue'
}
function urgencyVariant(u) {
  return { low: 'green', medium: 'blue', high: 'orange', critical: 'red' }[u] ?? 'blue'
}
