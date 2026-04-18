'use client';

// Ask ChristAIn section — AI chat powered by Claude API
// Suggested questions from propertyData.askClaude

import { useState, useRef, useEffect } from 'react';
import { usePropertyData } from '@/lib/PropertyDataContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function ChristAInIcon() {
  return (
    <div
      style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: '#2B3C50',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://cdn.prod.website-files.com/686ccd753cf9e1d8ecb2fb4a/69800ddd908591cf3f9ec1ac_bp%20webclip.png"
        alt="BPI"
        style={{ width: '28px', height: '28px', objectFit: 'cover' }}
      />
    </div>
  );
}

export default function AskClaudeSection() {
  const propertyData = usePropertyData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestedQuestions = propertyData.askClaude.suggestedQuestions;

  useEffect(() => {
    if (messages.length > 0 && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setError(null);

    const userMsg: Message = { role: 'user', content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ask-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, propertyData }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? 'Something went wrong. Please try again.');
      } else {
        setMessages([...updated, { role: 'assistant', content: data.content }]);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <section id="ask-claude" style={{ marginBottom: '64px' }}>
      {/* Heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', margin: 0 }}>
          Ask ChristAIn
        </h2>
        <span
          style={{
            backgroundColor: '#FEF3C7', color: '#92400E',
            fontSize: '0.72rem', fontWeight: 700,
            padding: '2px 8px', borderRadius: '4px',
            border: '1px solid #FDE68A', letterSpacing: '0.05em',
          }}
        >
          AI
        </span>
      </div>
      <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '24px' }}>
        Ask anything about this property, the local market, or investment strategy. Powered by Christian Baumann &amp; Claude AI.
      </p>

      <div
        style={{
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        {/* Chat area */}
        <div
          ref={chatContainerRef}
          style={{
            minHeight: messages.length === 0 ? '0' : '200px',
            maxHeight: '480px',
            overflowY: 'auto',
            padding: messages.length === 0 ? '0' : '20px 20px 8px',
            backgroundColor: '#FAFAFA',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              {msg.role === 'assistant' && <ChristAInIcon />}
              <div
                style={{
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  backgroundColor: msg.role === 'user' ? '#2B3C50' : '#FFFFFF',
                  color: msg.role === 'user' ? '#FFFFFF' : '#1a2b3c',
                  fontSize: '0.875rem',
                  lineHeight: 1.65,
                  border: msg.role === 'assistant' ? '1px solid #E5E7EB' : 'none',
                  boxShadow: msg.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <ChristAInIcon />
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px 12px 12px 2px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  display: 'flex', gap: '4px', alignItems: 'center',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      backgroundColor: '#9CA3AF',
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: '8px', padding: '10px 14px',
                fontSize: '0.8rem', color: '#B91C1C',
              }}
            >
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        {messages.length === 0 && suggestedQuestions.length > 0 && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#FAFAFA',
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            <p style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Suggested
            </p>
            <div className="suggested-questions-row">
              {suggestedQuestions.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={loading}
                  className="suggested-q-btn"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div
          style={{
            backgroundColor: '#F0F4F8',
            padding: '16px',
            borderTop: '1px solid #E5E7EB',
          }}
        >
          <p style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#2B3C50',
            marginBottom: '8px',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}>
            Type your question below
          </p>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. What are the main risks of this property?"
            disabled={loading}
            rows={3}
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              resize: 'none',
              border: '3px solid #2B3C50',
              borderRadius: '12px',
              padding: '16px 18px',
              fontSize: '1.1rem',
              color: '#1a2b3c',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              backgroundColor: loading ? '#F9FAFB' : '#FFFFFF',
              overflowY: 'hidden',
              boxShadow: '0 4px 12px rgba(43,60,80,0.12)',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              marginBottom: '12px',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#f2d82d';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(242,216,45,0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#2B3C50';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(43,60,80,0.12)';
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            style={{
              display: 'block',
              width: '100%',
              backgroundColor: loading || !input.trim() ? '#CBD5E1' : '#2B3C50',
              color: loading || !input.trim() ? '#94A3B8' : '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'Thinking\u2026' : '\u27A4  Send Question'}
          </button>
        </div>

        {/* Footer note */}
        <div
          style={{
            backgroundColor: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
            padding: '8px 16px',
            fontSize: '0.7rem',
            color: '#9CA3AF',
          }}
        >
          AI responses are informational only. Always consult a qualified professional before making investment decisions.
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .suggested-questions-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .suggested-q-btn {
          background: #FFFFFF;
          border: 1px solid #D1D5DB;
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 0.8rem;
          color: #374151;
          cursor: pointer;
          white-space: nowrap;
          transition: border-color 0.15s ease, background-color 0.15s ease;
          font-family: inherit;
        }
        .suggested-q-btn:hover {
          border-color: #2B3C50;
          background-color: #F9FAFB;
        }
        @media (max-width: 767px) {
          .suggested-questions-row {
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-bottom: 4px;
          }
          .suggested-questions-row::-webkit-scrollbar {
            display: none;
          }
          .suggested-q-btn {
            font-size: 0.75rem;
            padding: 5px 12px;
            flex-shrink: 0;
          }
        }
      `}</style>
    </section>
  );
}
