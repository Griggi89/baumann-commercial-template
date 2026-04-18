'use client';

// Local Industries section
// Data from propertyData.population (topIndustries, lgaName, benchmarkName, etc.)
// Sources: ABS Census + profile.id — auto-filled per property

import { usePropertyData } from '@/lib/PropertyDataContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const NAVY  = '#2B3C50';
const NAVY2 = '#7A96AE';
const GREY  = '#9CA3AF';
const LIGHT = '#E5E7EB';

function IndustryTooltip({ active, payload, label }: { active?: boolean; payload?: {name: string; value: number; color: string}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: `1px solid ${LIGHT}`, borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ fontWeight: 700, color: NAVY, marginBottom: '6px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}%</strong>
        </p>
      ))}
    </div>
  );
}

export default function IndustriesSection() {
  const propertyData = usePropertyData();
  const { population } = propertyData;

  const lgaName = population.lgaName || 'LGA';
    const benchmarkName = population.benchmarkName || 'QLD State';
  const hasData = population.topIndustries.length > 0;

  return (
    <section id="industries" style={{ marginBottom: '64px' }}>

      {/* Heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2b3c', margin: 0 }}>
          Local Industries
        </h2>
        <span style={{
          backgroundColor: '#F9FAFB', color: '#374151',
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
          padding: '2px 8px', borderRadius: '4px', border: `1px solid ${LIGHT}`,
        }}>ABS · .id</span>
      </div>
      <p style={{ color: GREY, fontSize: '0.875rem', marginBottom: '28px', lineHeight: 1.6 }}>
        Top industries by employment share — {lgaName} vs {benchmarkName} (2021 Census).
      </p>

      {hasData ? (
        <>
          {/* Industry bar chart */}
          <div style={{
            background: '#FFFFFF', border: `1px solid ${LIGHT}`,
            borderRadius: '12px', padding: '24px', marginBottom: '28px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: NAVY, marginBottom: '4px' }}>
              Top Local Industries
            </h3>
            <p style={{ fontSize: '0.8rem', color: GREY, marginBottom: '20px' }}>
              % of employed residents — {lgaName} vs {benchmarkName} benchmark (2021 Census)
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={population.topIndustries}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                barGap={4}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={LIGHT} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 11, fill: GREY }}
                  axisLine={false} tickLine={false}
                  domain={[0, 20]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#374151' }}
                  axisLine={false} tickLine={false}
                  width={175}
                />
                <Tooltip content={<IndustryTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem', paddingTop: '12px' }} />
                <Bar dataKey="lga"       name={lgaName}       fill={NAVY}  radius={[0, 4, 4, 0]} />
                <Bar dataKey="benchmark" name={benchmarkName}  fill={NAVY2} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Key takeaways */}
          {population.industryTakeaways.length > 0 && (
            <div style={{
              background: '#F9FAFB',
              border: `1px solid ${LIGHT}`,
              borderLeft: `4px solid ${NAVY}`,
              borderRadius: '8px',
              padding: '20px 24px',
              marginBottom: '20px',
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: NAVY, marginBottom: '12px' }}>
                What This Means for Your Investment
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {population.industryTakeaways.map((point: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                    <span style={{ color: NAVY, fontSize: '0.6rem', flexShrink: 0 }}>●</span>
                    <span style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.65 }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {population.industrySources.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: GREY }}>Sources:</span>
              {population.industrySources.map((s: { name: string; url: string }) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.72rem', color: '#374151', textDecoration: 'underline' }}
                >
                  {s.name}
                </a>
              ))}
            </div>
          )}
        </>
      ) : (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Industries data will appear here once populated from ABS / .id sources.
        </p>
      )}
    </section>
  );
}
