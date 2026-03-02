import { useState } from 'react'
import styles from './StepCard.module.css'

const NODE_META = {
  read_email:           { label: 'Read Email',       icon: '📨', color: '#6366f1' },
  classify_intent:      { label: 'Classify Intent',  icon: '🔍', color: '#8b5cf6' },
  search_documentation: { label: 'Search Docs',      icon: '📚', color: '#0ea5e9' },
  bug_tracking:         { label: 'Bug Tracking',     icon: '🐛', color: '#f59e0b' },
  draft_response:       { label: 'Draft Response',   icon: '✍️',  color: '#10b981' },
  human_review:         { label: 'Human Review',     icon: '👤', color: '#f97316' },
  send_reply:           { label: 'Send Reply',       icon: '📤', color: '#22c55e' },
}

export default function StepCard({ node, data }) {
  const [open, setOpen] = useState(false)
  const meta = NODE_META[node] ?? { label: node, icon: '⚙️', color: '#6b7280' }
  const hasDetails = data && Object.keys(data).length > 0

  return (
    <div className={styles.card} style={{ '--c': meta.color }}>
      <button
        className={styles.header}
        onClick={() => hasDetails && setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className={styles.icon}>{meta.icon}</span>
        <span className={styles.label}>{meta.label}</span>
        <span className={styles.check}>✓</span>
        {hasDetails && <span className={styles.caret}>{open ? '▴' : '▾'}</span>}
      </button>

      {open && hasDetails && (
        <div className={styles.body}>
          <StepDetails node={node} data={data} />
        </div>
      )}
    </div>
  )
}

function StepDetails({ node, data }) {
  if (node === 'classify_intent' && data.classification) {
    const c = data.classification
    return (
      <div className={styles.details}>
        <div className={styles.badges}>
          <Badge label={c.intent} variant={intentVariant(c.intent)} />
          <Badge label={`${c.urgency} urgency`} variant={urgencyVariant(c.urgency)} />
        </div>
        {c.topic && <p><strong>Topic:</strong> {c.topic}</p>}
        {c.summary && <p className={styles.muted}>{c.summary}</p>}
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

  if (node === 'bug_tracking' && data.search_results) {
    return <p className={styles.ticket}>{data.search_results.join(' · ')}</p>
  }

  if (node === 'draft_response' && data.draft_response) {
    return <p className={styles.draft}>{data.draft_response}</p>
  }

  if (node === 'send_reply') {
    return <p className={styles.sent}>Reply dispatched to customer.</p>
  }

  // Fallback: raw JSON for unexpected data
  const display = JSON.stringify(data, null, 2)
  return <pre className={styles.raw}>{display}</pre>
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
