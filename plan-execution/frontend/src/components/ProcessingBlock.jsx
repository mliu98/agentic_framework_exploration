import { useState } from 'react'
import styles from './ProcessingBlock.module.css'

// Human-readable summary per node (can use the resolved data)
const STEP_SUMMARY = {
  read_email:           ()     => 'Read your email',
  classify_intent:      (data) => {
    const c = data?.classification
    return c ? `${c.intent} · ${c.urgency} urgency` : 'Classifying your request'
  },
  search_documentation: (data) => {
    const n = data?.search_results?.length
    return n ? `Found ${n} relevant article${n > 1 ? 's' : ''}` : 'Searched knowledge base'
  },
  bug_tracking:         (data) => data?.search_results?.[0] ?? 'Filed a bug report',
  draft_response:       ()     => 'Drafted a response',
  human_review:         ()     => 'Flagged for human review',
  send_reply:           ()     => 'Reply sent to customer',
}

const STEP_ICON = {
  read_email: '📨', classify_intent: '🔍', search_documentation: '📚',
  bug_tracking: '🐛', draft_response: '✍️', human_review: '👤', send_reply: '📤',
}

export default function ProcessingBlock({ steps, status }) {
  const running = status === 'running'

  return (
    <div className={styles.block}>
      {steps.map((s, i) => (
        <StepRow key={`${s.node}-${i}`} node={s.node} data={s.data} />
      ))}
      {running && (
        <div className={styles.thinkingRow}>
          <span className={styles.spinner} />
          <span>Working on it…</span>
        </div>
      )}
    </div>
  )
}

function StepRow({ node, data }) {
  const [open, setOpen] = useState(false)
  const summary = (STEP_SUMMARY[node] ?? (() => node))(data)
  const icon = STEP_ICON[node] ?? '⚙️'
  const expandable = hasDetail(node, data)

  return (
    <div className={styles.row}>
      <button
        className={styles.rowBtn}
        onClick={() => expandable && setOpen(o => !o)}
        disabled={!expandable}
        aria-expanded={open}
      >
        <span className={styles.tick}>✓</span>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.summary}>{summary}</span>
        {expandable && <span className={styles.chevron}>{open ? '▴' : '▾'}</span>}
      </button>

      {open && (
        <div className={styles.detail}>
          <Detail node={node} data={data} />
        </div>
      )}
    </div>
  )
}

function hasDetail(node, data) {
  if (!data) return false
  if (node === 'classify_intent') return !!data.classification
  if (node === 'search_documentation') return (data.search_results?.length ?? 0) > 0
  if (node === 'draft_response') return !!data.draft_response
  return false
}

function Detail({ node, data }) {
  if (node === 'classify_intent' && data.classification) {
    const c = data.classification
    return (
      <div className={styles.detailInner}>
        <div className={styles.badges}>
          <Badge label={c.intent}           variant={intentColor(c.intent)} />
          <Badge label={`${c.urgency} urgency`} variant={urgencyColor(c.urgency)} />
        </div>
        {c.topic   && <p className={styles.detailLine}><strong>Topic:</strong> {c.topic}</p>}
        {c.summary && <p className={styles.detailMuted}>{c.summary}</p>}
      </div>
    )
  }

  if (node === 'search_documentation' && data.search_results) {
    return (
      <ul className={styles.list}>
        {data.search_results.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    )
  }

  if (node === 'draft_response' && data.draft_response) {
    return <p className={styles.draftText}>{data.draft_response}</p>
  }

  return null
}

function Badge({ label, variant }) {
  return <span className={`${styles.badge} ${styles[`b_${variant}`]}`}>{label}</span>
}

function intentColor(i) {
  return { billing: 'red', bug: 'orange', question: 'blue', feature: 'purple', complex: 'purple' }[i] ?? 'gray'
}
function urgencyColor(u) {
  return { low: 'green', medium: 'blue', high: 'orange', critical: 'red' }[u] ?? 'gray'
}
