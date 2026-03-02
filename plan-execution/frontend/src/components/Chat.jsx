import { useState, useRef, useEffect } from 'react'
import ProcessingBlock from './ProcessingBlock'
import ReviewCard from './ReviewCard'
import styles from './Chat.module.css'

const INPUT_PLACEHOLDER = {
  waiting_issue: 'Describe your issue…',
  waiting_email: 'Your email address…',
  processing: 'Agent is processing…',
  review: 'Waiting for your review…',
  resuming: 'Resuming…',
  done: 'Conversation complete',
  error: 'An error occurred',
}

export default function Chat({ messages, phase, onSend, onReviewDecision, onReset }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const isDisabled = !['waiting_issue', 'waiting_email'].includes(phase)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isDisabled) inputRef.current?.focus()
  }, [isDisabled])

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || isDisabled) return
    onSend(input.trim())
    setInput('')
  }

  const isActive = phase === 'processing' || phase === 'resuming'

  return (
    <div className={styles.shell}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.avatar}>S</div>
          <div>
            <div className={styles.agentName}>Support Agent</div>
            <div className={`${styles.status} ${isActive ? styles.statusBusy : styles.statusOnline}`}>
              <span className={styles.statusDot} />
              {isActive ? 'Processing…' : phase === 'done' ? 'Completed' : 'Online'}
            </div>
          </div>
        </div>
        {(phase === 'done' || phase === 'error') && (
          <button className={styles.newBtn} onClick={onReset}>+ New conversation</button>
        )}
      </header>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map(msg => (
          <Message key={msg.id} msg={msg} onReviewDecision={onReviewDecision} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className={styles.inputBar} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className={styles.input}
          type={phase === 'waiting_email' ? 'email' : 'text'}
          placeholder={INPUT_PLACEHOLDER[phase] ?? 'Type a message…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isDisabled}
        />
        <button className={styles.sendBtn} type="submit" disabled={isDisabled || !input.trim()}>
          <SendIcon />
        </button>
      </form>
    </div>
  )
}

function Message({ msg, onReviewDecision }) {
  if (msg.type === 'user') {
    return (
      <div className={`${styles.row} ${styles.rowRight}`}>
        <div className={styles.bubbleUser}>{msg.text}</div>
      </div>
    )
  }

  if (msg.type === 'bot') {
    return (
      <div className={styles.row}>
        <Avatar />
        <div className={styles.bubbleBot}>{msg.text}</div>
      </div>
    )
  }

  // All agent steps — one updating block per stream
  if (msg.type === 'processing-block') {
    return (
      <div className={styles.row}>
        <Avatar icon="⚙" dim />
        <ProcessingBlock steps={msg.steps} status={msg.status} />
      </div>
    )
  }

  if (msg.type === 'review') {
    return (
      <div className={styles.rowFull}>
        <ReviewCard data={msg.data} onDecision={onReviewDecision} />
      </div>
    )
  }

  if (msg.type === 'error') {
    return (
      <div className={styles.row}>
        <div className={styles.bubbleError}>{msg.text}</div>
      </div>
    )
  }

  return null
}

function Avatar({ icon = 'S', dim = false }) {
  return (
    <div className={`${styles.botAvatar} ${dim ? styles.botAvatarDim : ''}`}>
      {icon}
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
