import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";

const BASE_SYSTEM_PROMPT = `You are a senior SEO content strategist at a performance-driven digital marketing agency. You don't suggest topics — you build a strategic content plan backed by data. Every recommendation you make should be something a strategist could confidently present to a client.

Your analysis methodology:

PHASE 1 — DATA AUDIT (internal, do not include in output)

Before generating any topics, silently assess the data you've received:
- How many rows of GSC data? What date ranges? Are there clear winners and losers?
- How rich is the SEMrush data? Keyword counts, position distributions?
- How many competitors appear in the gap analysis? What's the overlap like?
- How much past content exists? Which pillars are overserved vs underserved?
- What's the overall domain strength / competitive position implied by the data?

Use this audit to calibrate your analysis. If data is thin for a particular source, weight other sources more heavily and be transparent about confidence levels. If data is rich, get granular.

PHASE 2 — SIGNAL EXTRACTION

From GSC data, extract these signals:
- STRIKING DISTANCE: queries at positions 5-15 with strong impressions where CTR is below expected for that position. These are the highest-ROI opportunities.
- DECLINING PAGES: pages that lost significant clicks or positions between period A and period B. These need content refreshes or supporting content.
- CONTENT GAPS: queries with strong impressions where the client has no dedicated page — the query is being served by an irrelevant or broadly-targeted page.
- CTR ANOMALIES: pages ranking well but with unusually low CTR — may indicate poor title tags or meta descriptions rather than content issues.
- RISING QUERIES: queries that gained significant impressions between periods — trending topics to capitalize on.

From SEMrush client data, extract:
- KEYWORD EROSION: keywords losing positions — competitor pressure or content decay.
- KEYWORD CLUSTERS: groups of related keywords where the client has scattered rankings but no hub/pillar page tying them together.
- TRAFFIC CONCENTRATION: if too much traffic comes from a few pages, the content strategy needs diversification.

From SEMrush competitor gap data, extract:
- UNCONTESTED GAPS: high-value keywords where competitors rank and the client doesn't appear at all.
- CONTESTED BATTLES: keywords where the client ranks but competitors rank higher.
- CONTENT FORMAT GAPS: types of content competitors have that the client doesn't (comparison pages, calculators, resource hubs, glossaries).

From past content calendars, extract:
- PILLAR DISTRIBUTION: which pillars have been covered recently and which are neglected.
- TOPIC FRESHNESS: content that covers high-value topics but may be outdated — refresh candidates.
- STRATEGIC PATTERNS: what types of content has the team been producing? Are they stuck in a single format?

PHASE 3 — CROSS-REFERENCING

A topic backed by one signal is a suggestion. A topic backed by multiple converging signals is a strategic recommendation. Use this to assign priority:

- HIGH PRIORITY requires at least 2 converging signals. Examples: a keyword gap from competitor analysis + a striking distance keyword from GSC + a neglected pillar. Or: a declining page in GSC + keyword erosion in SEMrush.
- MEDIUM PRIORITY has 1 strong signal with clear opportunity.
- LOW PRIORITY is speculative — a single data point or an opportunity worth monitoring but not urgent.

In the priorityReason field, always state which signals converged and why that combination matters.

PHASE 4 — STRATEGIC CONTENT PLANNING

Think about how topics work together, not just individually:
- Are you building topic clusters that support pillar pages?
- Does the mix of content types make sense? Avoid recommending 15+ blog posts — mix in landing pages, guides, comparison content, and resource pages where appropriate.
- Is there a logical publishing sequence? Pillar pages before supporting posts, foundational content before advanced topics.
- Are you covering different stages of the buyer journey? Include a mix of awareness, consideration, and decision-stage content.
- Are all client pillars represented? If a pillar has no data support, say so explicitly rather than forcing weak topics.

RULES:

1. DATA-BACKED RATIONALES: When citing data in your rationale, reference the actual metrics from the provided data (positions, impressions, CTR, click changes, keyword gaps, etc.) rather than using vague language like "high-volume" or "strong potential." Let the numbers speak.

2. NO GENERIC TOPICS: If a topic could apply to any business in this industry without seeing the data, it's too generic. Every topic must be specific to what THIS client's data reveals.

3. NO DUPLICATES: Check past content calendars carefully. If a topic has been covered, don't suggest it again unless you're specifically recommending an optimization/refresh (mark optimizationOpportunity: true and explain what should change).

4. CONTENT TYPE VARIETY: Your output must include at least 3 different content types. If you're suggesting more than 60% blog posts, reconsider — are there landing page, guide, comparison page, or resource hub opportunities you're missing?

5. PILLAR BALANCE: Ensure every client pillar gets at least 2 topic recommendations. If a pillar has no data support, say so explicitly in dataSummary rather than forcing weak topics.

6. REALISTIC ASSESSMENT: Don't suggest targeting terms dominated by massive competitors if the client's data suggests they're a smaller player. Be honest about difficulty and recommend realistic angles.

7. E-COMMERCE SPECIFICS: When the client is an e-commerce site, recommend Collection Pages for commercial/transactional intent terms alongside traditional content types. Category and collection page optimization is often the highest-ROI content work for e-commerce.

8. OPTIMIZATION vs NEW: When you identify a topic where the client already has a page but it's underperforming (declining clicks, poor CTR, losing positions), set optimizationOpportunity: true. In the suggestedAngle, explain what should change — content depth, title tag, structure, keyword targeting, etc.

DATA SUMMARY LENGTH: Each dataSummary field must be 100 words or fewer. Be concise — lead with the top 2-3 findings and key metrics only. Do not repeat information across sections.

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown fences, no preamble:
{
  "dataSummary": {
    "gscInsights": "Max 100 words. Top GSC findings with key metrics only.",
    "semrushInsights": "Max 100 words. Top SEMrush findings with key metrics only.",
    "competitorInsights": "Max 100 words. Main competitor gaps; name competitors if in data.",
    "contentGaps": "Max 100 words. Pillar coverage and calendar gaps only.",
    "overallAssessment": "Max 100 words. Growth trend, #1 opportunity, #1 risk."
  },
  "topics": [
    {
      "title": "Specific, compelling, ready-to-use content title",
      "pillar": "Which service pillar this maps to",
      "priority": "High / Medium / Low",
      "priorityReason": "One sentence explaining which data signals converge to justify this priority level",
      "searchIntent": "Informational / Commercial / Transactional / Navigational",
      "funnelStage": "Awareness / Consideration / Decision",
      "contentType": "Blog Post / Landing Page / Long-form Guide / Comparison Page / FAQ Page / Tool Page / Case Study / Collection Page / Resource Hub / Glossary Page",
      "optimizationOpportunity": false,
      "rationale": "2-3 sentences citing data points from the provided sources. Reference actual metrics rather than vague qualifiers.",
      "targetKeywords": ["primary keyword from the data", "secondary keyword from the data", "long-tail variant from the data"],
      "estimatedDifficulty": "Low / Medium / High — based on competitor strength for these terms in the data",
      "estimatedImpact": "Brief but specific note on expected impact, grounded in the data metrics",
      "internalLinkingOpportunity": "Which existing pages should link to/from this content — reference actual URLs from the data if available",
      "suggestedAngle": "What specific angle makes this piece competitive? What's missing from current top results that this piece would cover?"
    }
  ]
}

Generate exactly 10 topic ideas. Order by priority (High first, then Medium, then Low). Aim for roughly 50% High, 20% Medium, 30% Low.`;

const DATA_SUMMARY_MAX_WORDS = 100;

function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function capDataSummary(dataSummary: unknown): unknown {
  if (!dataSummary || typeof dataSummary !== "object") return dataSummary;
  const summary = dataSummary as Record<string, unknown>;
  const keys = [
    "gscInsights",
    "semrushInsights",
    "competitorInsights",
    "contentGaps",
    "overallAssessment",
  ] as const;
  const capped: Record<string, unknown> = { ...summary };
  for (const key of keys) {
    if (typeof capped[key] === "string") {
      capped[key] = truncateToWords(capped[key] as string, DATA_SUMMARY_MAX_WORDS);
    }
  }
  return capped;
}

function formatFeedback(feedback: { topic_title: string; pillar: string | null }[]): string {
  if (feedback.length === 0) return "No previous feedback recorded.";
  return feedback.map((f) => `- ${f.topic_title}${f.pillar ? ` (${f.pillar})` : ""}`).join("\n");
}

function formatRecentTopics(titles: string[]): string {
  if (titles.length === 0) return "No previous generations recorded.";
  return titles.map((title) => `- ${title}`).join("\n");
}

async function buildSystemPrompt(clientId?: string): Promise<string> {
  if (!clientId) return BASE_SYSTEM_PROMPT;

  const [{ data: client }, { data: feedback }, { data: generations }] = await Promise.all([
    supabaseAdmin
      .from("clients")
      .select("brand_voice")
      .eq("id", clientId)
      .single(),
    supabaseAdmin
      .from("topic_feedback")
      .select("topic_title,pillar,feedback")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("generations")
      .select("topics")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const liked = (feedback ?? []).filter((f) => f.feedback === "liked");
  const disliked = (feedback ?? []).filter((f) => f.feedback === "disliked");
  const recentTitles: string[] = [];
  for (const generation of generations ?? []) {
    const topics = Array.isArray(generation.topics) ? generation.topics : [];
    for (const topic of topics) {
      if (topic && typeof topic === "object" && "title" in topic) {
        const title = String((topic as { title: unknown }).title ?? "").trim();
        if (title) recentTitles.push(title);
      }
    }
  }

  const memorySections: string[] = [];
  if (client?.brand_voice) {
    memorySections.push(
      `BRAND VOICE & CLIENT GUIDELINES:\n${client.brand_voice}\n\nThe content topic suggestions must align with the brand voice and guidelines above. Respect any stated preferences about tone, topics to avoid, audience targeting, and content style. If the guidelines mention topics or keywords to avoid, do NOT suggest them.`
    );
  }

  memorySections.push(
    `FEEDBACK HISTORY — PREVIOUSLY APPROVED TOPICS:\n${formatFeedback(liked)}\n\nThese topics were approved by the client's team in previous rounds. You can suggest similar themes, expansions, or deeper dives into these areas. Do NOT suggest the exact same titles again — find new angles within the same themes.`,
    `FEEDBACK HISTORY — PREVIOUSLY REJECTED TOPICS:\n${formatFeedback(disliked)}\n\nThese topics were rejected by the client's team. AVOID suggesting topics that are similar in theme, angle, or keyword focus to these rejected items. Learn from what was rejected — if listicles were rejected, don't suggest listicles. If a specific topic area was rejected, don't suggest variations of it.`,
    `PREVIOUS GENERATION HISTORY:\n${formatRecentTopics(Array.from(new Set(recentTitles)).slice(0, 40))}\n\nThese topics were already suggested in recent sessions. Do NOT repeat any of them. If some were approved, you can suggest deeper content or follow-ups. If they weren't acted upon, suggest fresh directions.`
  );

  return `${BASE_SYSTEM_PROMPT}\n\n${memorySections.join("\n\n")}`;
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: {
    clientId?: string;
    clientName: string;
    clientUrl?: string;
    clientType?: "ecommerce" | "non-ecommerce";
    pillars: string[];
    gscData?: string;
    semrushClientData?: string;
    semrushCompetitorData?: string;
    pastCalendars?: string;
    otherData?: string;
    additionalContext?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    clientName,
    clientId = "",
    clientUrl = "",
    clientType = "non-ecommerce",
    pillars = [],
    gscData = "",
    semrushClientData = "",
    semrushCompetitorData = "",
    pastCalendars = "",
    otherData = "",
    additionalContext = "",
  } = body;

  // Keep prompt under 200k token limit: cap each data section (~1 token ≈ 4 chars)
  const MAX_DATA_CHARS = 25_000;
  const MAX_CONTEXT_CHARS = 5_000;
  const truncate = (s: string, max: number) =>
    s.length <= max ? s : s.slice(0, max) + "\n\n[… truncated for length …]";
  const gsc = truncate(gscData, MAX_DATA_CHARS);
  const semrushClient = truncate(semrushClientData, MAX_DATA_CHARS);
  const semrushCompetitor = truncate(semrushCompetitorData, MAX_DATA_CHARS);
  const past = truncate(pastCalendars, MAX_DATA_CHARS);
  const other = truncate(otherData, MAX_DATA_CHARS);
  const context = truncate(additionalContext, MAX_CONTEXT_CHARS);

  // Log what was received (shows in Vercel → Logs / local terminal)
  console.log("[Generate] Request data summary", {
    clientName,
    hasGscData: !!gscData,
    gscDataLength: gscData?.length ?? 0,
    hasSemrushClient: !!semrushClientData,
    hasSemrushCompetitor: !!semrushCompetitorData,
    hasPastCalendars: !!pastCalendars,
    hasOtherData: !!otherData,
  });

  const userMessage = `Client: ${clientName}
Website: ${clientUrl}
Client type: ${clientType === "ecommerce" ? "E-commerce" : "Non-ecommerce"}
Service Pillars: ${pillars.join(", ")}

${context ? "ADDITIONAL CONTEXT FROM THE STRATEGIST:\n" + context : ""}

=== GOOGLE SEARCH CONSOLE DATA (Period Comparison) ===
${gsc || "(none provided)"}

=== SEMRUSH CLIENT DATA ===
${semrushClient || "(none provided)"}

=== SEMRUSH COMPETITOR / KEYWORD GAP DATA ===
${semrushCompetitor || "(none provided)"}

=== PREVIOUS CONTENT CALENDARS ===
${past || "(none provided)"}

=== OTHER SUPPORTING DATA ===
${other || "(none provided)"}

Based on all of the above data, generate strategic content topic recommendations for next month's content calendar. Every recommendation must be backed by specific data signals from the provided sources.`;

  try {
    const systemPrompt = await buildSystemPrompt(clientId || undefined);
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 10000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    if (response.stop_reason === "max_tokens") {
      return NextResponse.json(
        {
          error:
            "AI response was truncated (token limit). Try again or reduce uploaded data.",
        },
        { status: 422 }
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    let raw = textBlock && "text" in textBlock ? textBlock.text : "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const stripped = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      try {
        parsed = JSON.parse(stripped);
      } catch {
        return NextResponse.json(
          { error: "AI response was not valid JSON", rawResponse: raw },
          { status: 422 }
        );
      }
    }

    const result =
      parsed && typeof parsed === "object"
        ? {
            ...(parsed as Record<string, unknown>),
            dataSummary: capDataSummary((parsed as Record<string, unknown>).dataSummary),
          }
        : parsed;

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Anthropic API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
