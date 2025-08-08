### AI Processing Quality Decision Brief (Option 1 + Alternatives)

- **Owner**: PM (review/decide), Dev (implement), QA (measure)
- **Context Date**: Today
- **Scope**: Improve transcription and extraction quality for Irish construction voice notes and WhatsApp text.

### 1) Executive Summary
- **Problem**: Current AI results are below expectations. Transcriptions and extractions occasionally miss domain details or make minor “corrections” that change meaning.
- **Proposed Path (Option 1)**: Keep OpenAI stack, add audio normalization, strengthen guardrails, and add regex baselines to lift accuracy quickly with low risk.
- **Why this first**: Fastest, lowest-risk improvements without changing vendors. Builds a solid baseline to compare alternatives later.
- **Ask from PM**: Confirm latency and cost budgets; approve quick-win scope; decide whether audio normalization is in the 48h sprint or next week behind a feature flag.

### 2) Current Implementation (for context)
- **Transcription**: `whisper-1` via `bmad-web/lib/services/transcription.service.ts` with a construction prompt.
- **Fixer**: `bmad-web/lib/services/transcription-fixer.ts` applies domain patterns; optionally uses GPT to “validate and correct”.
- **Extraction**: `bmad-web/lib/services/extraction.service.ts` uses Chat Completions to emit JSON (amounts/materials/dates/safety/work_status).
- **Endpoints**: `pages/api/processing/{transcribe|extract|process}.ts` orchestrate pipeline.
- **Observed gaps**: No audio pre-processing; fixer can over-correct; extraction lacks schema enforcement and regex-backed baseline; occasional path/MIME brittleness.

### 3) Goals and Success Metrics (proposed)
- **Transcription accuracy**: WER ≤ 15% on a small benchmark (10–20 clips).
- **Extraction quality**: F1 ≥ 0.85 for amounts/materials/dates.
- **Hallucination control**: Added tokens vs input < 1% of runs.
- **Performance**: P95 total processing ≤ 30s (typical 1–2 min clips).
- **Why these matter**:
  - **WER** traces objective ASR quality; **F1** validates business-critical fields.
  - **Hallucination** protects evidence integrity.
  - **P95** ensures consistent UX for users batching submissions.

### 4) Option 1: Quick-Win Plan (Recommended)
- **What**:
  - **Audio normalization**: Convert to mono, 16 kHz WAV, normalize gain (ffmpeg). Improves ASR on quiet/noisy recordings.
  - **Fixer guardrails**: "Minimal edits only; no new info" + run only if raw > 40 chars + reject if token additions > 15% → fallback to pattern-only.
  - **Extraction hardening**: temperature 0.0; “do-not-infer” clause; add regex baseline (amounts/dates/materials); union with LLM output, de-dup.
  - **Path/MIME safety**: Normalize Supabase paths; infer MIME from extension if missing.
- **Why it works**:
  - Normalization raises Whisper signal quality.
  - Guardrails prevent GPT from rewriting content.
  - Regex baselines catch deterministic fields Whisper/LLM miss.
  - Path/MIME fixes reduce intermittent failures.
- **Impact**: Expected 5–15% relative lift in transcription accuracy; steadier extractions; fewer “too-perfect” rewrites.
- **Risk**: Low. Adds ffmpeg dependency; otherwise internal logic changes are contained.

### 5) Latency & Cost Budgets (proposed for PM confirmation)
- **Latency targets**:
  - **P95 total** ≤ 30s; **P99** ≤ 45s (for 1–2 min clips)
  - Breakdown: Audio normalization ≤ 2s; Whisper 10–25s; Fixer + Extraction ≤ 4s
- **Cost targets (per ~1-minute clip)**:
  - Transcription ≤ $0.02
  - Fixer + Extraction ≤ $0.005
  - Monthly alert threshold: $50 (adjust as usage grows)
- **Why**:
  - Keeps UX responsive, supports Friday “10-minute workflow”. Cost guardrails prevent runaway spend in early iterations.

### 6) Alternatives (for comparison)
- **Option 2: Hybrid ASR A/B (Deepgram/AssemblyAI/Google)**
  - **Pros**: Potential additional 5–15% WER improvement on varied audio profiles.
  - **Cons**: New vendor integration, cost/privacy review, SDK differences.
  - **When to choose**: If Option 1 gains plateau or data shows Whisper underperforms on field recordings.
- **Option 3: On-Prem Whisper large-v3 (GPU)**
  - **Pros**: Privacy, tunable VAD/noise; cost control at scale.
  - **Cons**: Infra/ops complexity; longer time-to-value.
  - **When to choose**: If compliance or large-scale cost drives on-prem.
- **Option 4: Prompt/guardrails only (no audio work)**
  - **Pros**: Fastest to ship.
  - **Cons**: Limited gains if raw ASR remains weak.
  - **When to choose**: If infra constraints block ffmpeg temporarily.

### 7) Risks and Mitigations
- **Hallucination risk**: GPT “corrects” beyond typos → Add diff guard (< 15% tokens added), reject and fallback to patterns.
- **Noisy site audio** later: Office tests look good, field recordings regress → Prepare Option 2 A/B pilot.
- **Latency spikes**: Large clips/network → Timeouts, retries, backoff; queue heavy jobs.
- **Cost creep**: Increased volume → Alerts, monthly budget cap, sampling for A/B.

### 8) Proposed Timeline
- **48 hours (Quick Wins)**:
  - Implement fixer guardrails, extraction hardening, path/MIME normalization.
  - (Optional) Ship audio normalization now; otherwise feature-flag and roll next week.
  - Create a 10–12 clip benchmark (office recordings ok initially); label gold transcriptions/extractions.
  - Measure baseline WER/F1; set non-regression thresholds.
- **Next 1 week (Hardening)**:
  - Enforce extraction JSON schema; expand domain patterns; add hallucination diff checker.
  - Optional A/B with an external ASR on 20–30% traffic for comparative WER/cost.
  - Add CI gates for WER/F1.

### 9) Decisions Needed from PM
1. **Latency targets**: Approve P95 ≤ 30s, P99 ≤ 45s? If different, specify.
2. **Cost targets**: Approve per-clip budgets and monthly alert threshold? If different, specify.
3. **Audio normalization timing**: Include in 48h sprint or ship next week behind a feature flag?
4. **A/B testing**: Approve a small external ASR pilot after quick wins?
5. **Benchmark dataset**: Approve creating 6–8 additional short office recordings this week (30–60s) for initial benchmarking?

### 10) Appendix: Labeling Templates (for QA)
- **Gold transcription**: plain text per clip, e.g., `clips/<id>.txt`
- **Gold extraction JSON**:
```json
{
  "amounts": ["€3,500", "15 cubic metres", "2 tonnes"],
  "materials": ["concrete", "rebar", "blocks"],
  "dates": ["tomorrow"],
  "safety_concerns": ["scaffolding needs inspection"],
  "work_status": "foundation pour planned"
}
```

### Why Option 1 first
- **Fastest measurable lift** without vendor risk or infra overhaul.
- **Builds a trustworthy baseline** for future A/B and on-prem explorations.
- **Aligns with MVP**: Reliable transcriptions/extractions that meet acceptance criteria and keep UX responsive. 