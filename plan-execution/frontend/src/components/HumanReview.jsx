import { useState } from 'react'
import styles from './HumanReview.module.css'

const URGENCY_COLOR = { low: 'green', medium: 'blue', high: 'orange', critical: 'red' }
const INTENT_COLOR = { billing: 'red', bug: 'orange', question: 'blue', feature: 'purple', complex: 'purple' }

function Badge({ label, variant }) {
  return <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>{label}</span>
}

export default function HumanReview({ data, onDecision }) {
  const [editedResponse, setEditedResponse] = useState(data.draft_response ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function decide(approved) {
    setSubmitting(true)
    await onDecision({ approved, edited_response: approved ? editedResponse : undefined })
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.alertIcon}>⚠</span>
        <div>
          <h2 className={styles.title}>Human Review Required</h2>
          <p className={styles.subtitle}>This email needs your attention before a response is sent.</p>
        </div>
      </div>

      {/* Classification badges */}
      <div className={styles.meta}>
        {data.intent && <Badge label={`Intent: ${data.intent}`} variant={INTENT_COLOR[data.intent] ?? 'blue'} />}
        {data.urgency && <Badge label={`Urgency: ${data.urgency}`} variant={URGENCY_COLOR[data.urgency] ?? 'blue'} />}
        {data.email_id && <span className={styles.emailId}>{data.email_id}</span>}
      </div>

      {/* Original email */}
      {data.original_email && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Original Email</h3>
          <div className={styles.emailBox}>{data.original_email}</div>
        </section>
      )}

      {/* Editable draft */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Draft Response
          <span className={styles.editHint}> — edit below if needed</span>
        </h3>
        <textarea
          className={styles.draftEditor}
          rows={8}
          value={editedResponse}
          onChange={e => setEditedResponse(e.target.value)}
          disabled={submitting}
        />
      </section>

      {/* Action row */}
      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.btnApprove}`}
          onClick={() => decide(true)}
          disabled={submitting || !editedResponse.trim()}
        >
          {submitting ? 'Sending…' : '✓ Approve & Send'}
        </button>
        <button
          className={`${styles.btn} ${styles.btnReject}`}
          onClick={() => decide(false)}
          disabled={submitting}
        >
          ✕ Reject — Handle Manually
        </button>
      </div>
    </div>
  )
}
