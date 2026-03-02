import { useState } from 'react'
import styles from './EmailForm.module.css'

const EXAMPLES = [
  {
    label: 'Billing (critical)',
    email_content: 'I was charged twice for my subscription this month! This is unacceptable, please fix it immediately!',
    sender_email: 'angry.customer@example.com',
  },
  {
    label: 'Bug report',
    email_content: "The export button on the dashboard crashes the app every time I click it. I'm on Chrome 124.",
    sender_email: 'user123@example.com',
  },
  {
    label: 'Feature request',
    email_content: 'Would it be possible to add dark mode to the app? Many of my colleagues have been asking for it.',
    sender_email: 'feedback@example.com',
  },
]

export default function EmailForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    email_content: '',
    sender_email: '',
    email_id: '',
  })

  function applyExample(ex) {
    setFormData(prev => ({
      ...prev,
      email_content: ex.email_content,
      sender_email: ex.sender_email,
    }))
  }

  function handleChange(e) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!formData.email_content.trim() || !formData.sender_email.trim()) return
    onSubmit(formData)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Email Support Agent</h1>
        <p className={styles.subtitle}>
          Paste a customer email below. The agent will classify it, draft a response,
          and ask for your review when needed.
        </p>

        <div className={styles.examples}>
          <span className={styles.examplesLabel}>Try an example:</span>
          {EXAMPLES.map(ex => (
            <button key={ex.label} className={styles.exampleChip} onClick={() => applyExample(ex)}>
              {ex.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Sender Email *
            <input
              className={styles.input}
              name="sender_email"
              type="email"
              placeholder="customer@example.com"
              value={formData.sender_email}
              onChange={handleChange}
              required
            />
          </label>

          <label className={styles.label}>
            Email Body *
            <textarea
              className={styles.textarea}
              name="email_content"
              placeholder="Paste the customer's email here…"
              rows={7}
              value={formData.email_content}
              onChange={handleChange}
              required
            />
          </label>

          <label className={styles.label}>
            Email ID (optional)
            <input
              className={styles.input}
              name="email_id"
              type="text"
              placeholder="email_001"
              value={formData.email_id}
              onChange={handleChange}
            />
          </label>

          <button
            className={styles.submitBtn}
            type="submit"
            disabled={!formData.email_content.trim() || !formData.sender_email.trim()}
          >
            Process Email →
          </button>
        </form>
      </div>
    </div>
  )
}
