import { NextRequest, NextResponse } from 'next/server';
import type { PropertyData } from '@/lib/propertyData';

// ─────────────────────────────────────────────────────────────────────────────
// Ask ChristAIn — Commercial dashboard chat
// System prompt is built at request time from the client-sent PropertyData so
// every chat carries the current deal's context — no manual templating.
// ─────────────────────────────────────────────────────────────────────────────

const fmtMoney = (n: number | undefined) =>
  n && n > 0 ? `$${Math.round(n).toLocaleString('en-AU')}` : 'n/a';

const fmtPct = (n: number | undefined, digits = 1) =>
  n && n > 0 ? `${(n * 100).toFixed(digits)}%` : 'n/a';

function buildSystemPrompt(pd: PropertyData | undefined): string {
  const base = `You are a commercial property investment assistant for Baumann Property, a buyer's agency.
You are helping a client reviewing a specific commercial real estate investment.`;

  if (!pd || !pd.address) {
    return `${base}

No property context was provided for this session. Answer general commercial property investment questions only and flag when a question requires the deal's specific numbers.

ADVISOR: Christian Baumann, Director & Qualified Property Investment Advisor
Website: baumannproperty.com.au | Email: christian@baumannproperty.com.au`;
  }

  const cf = pd.cashflow;
  const deposit        = cf.upfrontCosts?.deposit ?? 0;
  const stampDuty      = cf.upfrontCosts?.stampDuty ?? 0;
  const gst            = cf.upfrontCosts?.gst ?? 0;
  const conveyancing   = cf.upfrontCosts?.conveyancing ?? 0;
  const bldgInspect    = cf.upfrontCosts?.buildingAndPest ?? 0;
  const totalRequired  = cf.upfrontCosts?.totalRequired ?? 0;

  const loanAmount     = (cf.purchasePrice ?? 0) * (cf.lvr ?? 0);
  const annualInterest = loanAmount * (cf.interestRate ?? 0);
  const netAnnualCF    = (cf.annualRent ?? 0) - (cf.annualExpenses ?? 0) - annualInterest;
  const capRate        = cf.purchasePrice ? (cf.annualRent / cf.purchasePrice) : 0;

  const details       = pd.features?.details?.map(d => `${d.label}: ${d.value}`).join(', ') || '';
  const tenantItems   = pd.tenantLease?.items?.map(i => `${i.label}: ${i.value}`).join('; ') || '';
  const rentalSummary = pd.rentalAssessment?.summary?.map(i => `${i.label}: ${i.value}`).join('; ') || '';
  const salesSummary  = pd.salesComparables?.summary?.map(i => `${i.label}: ${i.value}`).join('; ') || '';
  const suburb        = pd.suburbProfile?.summary?.map(i => `${i.label}: ${i.value}`).join('; ') || '';
  const distances     = pd.location?.distances?.slice(0, 9).map(d => `${d.place} (${d.distance}${d.driveTime ? ', ' + d.driveTime : ''})`).join('; ') || '';
  const projects      = pd.government?.projects?.map(p => p.title).join('; ') || '';
  const industries    = pd.population?.topIndustries?.slice(0, 5).map(i => `${i.name} ${i.lga}%`).join(', ') || '';
  const outgoings     = cf.expenseBreakdown?.map(e => `${e.label} ${fmtMoney(e.annual)}/yr`).join(', ') || '';

  return `${base}

PROPERTY:
- Address: ${pd.address}
- ${details}
- Listing: ${pd.reaLink || 'n/a'}

LEASE & TENANT:
${tenantItems ? '- ' + tenantItems : '- (not yet populated)'}

LEASE ASSUMPTION: Unless the lease structure above says otherwise, the cashflow assumes a triple-net lease (tenant pays outgoings including land tax and maintenance).

CASHFLOW:
- Purchase price: ${fmtMoney(cf.purchasePrice)}
- Net annual rent: ${fmtMoney(cf.annualRent)}
- Net yield / cap rate: ${(capRate * 100).toFixed(2)}%
- Annual outgoings (to landlord): ${fmtMoney(cf.annualExpenses)}
- Outgoings breakdown: ${outgoings || '(n/a — triple-net if blank)'}
- LVR: ${fmtPct(cf.lvr, 0)} · Loan: ${fmtMoney(loanAmount)} · Interest rate: ${fmtPct(cf.interestRate, 2)}
- Annual interest cost: ${fmtMoney(annualInterest)}
- Year 1 net cashflow (post-interest, pre-tax): ${fmtMoney(netAnnualCF)} (${netAnnualCF < 0 ? 'shortfall held for capital growth' : 'surplus'})

UPFRONT CASH REQUIRED:
- Deposit: ${fmtMoney(deposit)}
- Stamp duty: ${fmtMoney(stampDuty)}
${gst > 0 ? `- GST: ${fmtMoney(gst)}\n` : ''}- Conveyancing / solicitor: ${fmtMoney(conveyancing)}
- Building inspection: ${fmtMoney(bldgInspect)}
- Total cash/equity required: ${fmtMoney(totalRequired)}

GROWTH ASSUMPTIONS:
- Capital growth: ${fmtPct(cf.capitalGrowthRate, 0)} p.a.
- Rent review: ${fmtPct(cf.rentGrowthRate, 0)} p.a. (yearly review / CPI)

RENTAL ASSESSMENT (sqm rates):
${rentalSummary ? '- ' + rentalSummary : '- (not yet populated)'}

SALES COMPARABLES:
${salesSummary ? '- ' + salesSummary : '- (not yet populated)'}

SUBURB MARKET PROFILE:
${suburb ? '- ' + suburb : '- (not yet populated)'}

LOCATION:
- Region: ${pd.government?.regionName || 'n/a'}
- LGA: ${pd.population?.lgaName || 'n/a'}
- Key distances: ${distances || '(n/a)'}

GOVERNMENT / INFRASTRUCTURE:
- ${projects || '(n/a)'}

LOCAL EMPLOYMENT (top industries): ${industries || '(n/a)'}

ADVISOR: Christian Baumann, Director & Qualified Property Investment Advisor
Website: baumannproperty.com.au | Email: christian@baumannproperty.com.au

YOUR ROLE:
- Answer questions about this commercial property, the tenant/lease, the local market, cap rates, and due diligence
- Ground every claim in the numbers above — do not invent figures
- Use commercial terminology correctly: cap rate, net yield, WALE, tenant covenant, triple-net, outgoings, rent review
- Be helpful, clear, professional — this is a client reviewing a real investment
- Note when a figure is an estimate, assumption, or not yet populated
- Do NOT provide formal financial, legal, or tax advice — recommend consulting relevant professionals
- Keep responses concise (2–5 sentences for most answers, longer only when the question is complex)
- If asked something not covered above, say so and offer what context you can from the numbers that ARE given`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, propertyData } = await request.json();

    // Prefer Vercel AI Gateway (auto-injected OIDC token in Vercel deployments).
    // Falls back to a manually-set AI_GATEWAY_API_KEY, then direct Anthropic API.
    const gatewayKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    const directKey  = process.env.ANTHROPIC_API_KEY;

    if (!gatewayKey && !directKey) {
      return NextResponse.json(
        { error: 'No AI credentials configured (set AI_GATEWAY_API_KEY or ANTHROPIC_API_KEY in Vercel).' },
        { status: 500 }
      );
    }

    const systemPrompt = buildSystemPrompt(propertyData as PropertyData | undefined);

    let response: Response;

    if (gatewayKey) {
      response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gatewayKey}`,
        },
        body: JSON.stringify({
          model: 'anthropic/claude-haiku-4.5',
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('AI Gateway error:', response.status, err);
        return NextResponse.json(
          { error: `AI Gateway request failed (${response.status}): ${err.slice(0, 200)}` },
          { status: 500 }
        );
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? '';
      return NextResponse.json({ content: text });
    }

    // Fallback: direct Anthropic API
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': directKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', response.status, err);
      return NextResponse.json(
        { error: `Anthropic API error (${response.status}): ${err.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    return NextResponse.json({ content: text });
  } catch (error) {
    console.error('Ask ChristAIn error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
