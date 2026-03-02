import styles from './StepTracker.module.css'

const NODE_META = {
  read_email: { label: 'Read Email', icon: '📨', color: '#6366f1' },
  classify_intent: { label: 'Classify Intent', icon: '🔍', color: '#8b5cf6' },
  search_documentation: { label: 'Search Docs', icon: '📚', color: '#0ea5e9' },
  bug_tracking: { label: 'Bug Tracking', icon: '🐛', color: '#f59e0b' },
  draft_response: { label: 'Draft Response', icon: '✍️', color: '#10b981' },
  human_review: { label: 'Human Review', icon: '👤', color: '#f97316' },
  send_reply: { label: 'Send Reply', icon: '📤', color: '#22c55e' },
}

function NodeData({ node, data }) {
  if (!data || Object.keys(data).length === 0) return null

  if (node === 'classify_intent' && data.classification) {
    const c = data.classification
    return (
      <div className={styles.nodeData}>
        <div className={styles.badges}>
          <Badge label={c.intent} color="purple" />
          <Badge label={c.urgency} color={urgencyColor(c.urgency)} />
        </div>
        <p className={styles.topic}><strong>Topic:</strong> {c.topic}</p>
        <p className={styles.summary}>{c.summary}</p>
      </div>
    )
  }

  if (node === 'search_documentation' && data.search_results) {
    return (
      <ul className={styles.resultList}>
        {data.search_results.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    )
  }

  if (node === 'bug_tracking' && data.search_results) {
    return (
      <div className={styles.nodeData}>
        {data.search_results.map((r, i) => <p key={i} className={styles.ticketId}>{r}</p>)}
      </div>
    )
  }

  if (node === 'draft_response' && data.draft_response) {
    return (
      <p className={styles.draft}>{data.draft_response}</p>
    )
  }

  if (node === 'send_reply') {
    return <p className={styles.sentMsg}>Reply dispatched to customer.</p>
  }

  return null
}

function Badge({ label, color }) {
  return <span className={styles.badge} style={{ '--badge-color': badgePalette[color] }}>{label}</span>
}

const badgePalette = {
  purple: '#7c3aed',
  red: '#dc2626',
  orange: '#d97706',
  yellow: '#ca8a04',
  green: '#16a34a',
  blue: '#2563eb',
}

function urgencyColor(u) {
  return { low: 'green', medium: 'yellow', high: 'orange', critical: 'red' }[u] ?? 'blue'
}

export default function StepTracker({ steps, activeNode, phase }) {
  const isRunning = phase === 'processing' || phase === 'resuming'

  return (
    <div className={styles.tracker}>
      <h2 className={styles.heading}>Agent Steps</h2>

      <div className={styles.timeline}>
        {steps.map((step) => {
          const meta = NODE_META[step.node] ?? { label: step.node, icon: '⚙️', color: '#6b7280' }
          return (
            <div key={step.id} className={styles.step}>
              <div className={styles.stepIconWrap} style={{ '--step-color': meta.color }}>
                <span className={styles.stepIcon}>{meta.icon}</span>
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepLabel}>{meta.label}</span>
                  <span className={styles.checkmark}>✓</span>
                </div>
                <NodeData node={step.node} data={step.data} />
              </div>
            </div>
          )
        })}

        {isRunning && (
          <div className={`${styles.step} ${styles.stepActive}`}>
            <div className={styles.stepIconWrap} style={{ '--step-color': '#4f46e5' }}>
              <span className={styles.spinnerDot} />
            </div>
            <div className={styles.stepContent}>
              <span className={styles.stepLabel}>Processing…</span>
            </div>
          </div>
        )}

        {phase === 'review' && (
          <div className={`${styles.step} ${styles.stepReview}`}>
            <div className={styles.stepIconWrap} style={{ '--step-color': '#f97316' }}>
              <span className={styles.stepIcon}>👤</span>
            </div>
            <div className={styles.stepContent}>
              <span className={styles.stepLabel}>Awaiting your review</span>
            </div>
          </div>
        )}

        {phase === 'done' && steps.length === 0 && (
          <p className={styles.empty}>No steps recorded.</p>
        )}
      </div>
    </div>
  )
}
