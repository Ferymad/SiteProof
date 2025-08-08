# Overall UX Goals & Principles - Enhanced with Business Risk UI

**Update**: UI now displays business risk assessments and critical error detection instead of unreliable confidence scores

## Target User Personas

**1. Office PM - John (Primary User)**
- **Context**: Construction PM, age 35-55, manages daily site operations from office
- **Scenario**: Every Friday at 4:30 PM, must convert week's WhatsApp messages into dayworks documentation by 5 PM deadline
- **Current Pain**: Manually transcribing voice notes and organizing photos takes 3 hours
- **Tech Comfort**: Expert WhatsApp user, comfortable with basic web tools, skeptical of complex software

**2. Groundworker Foreman - Pat (Information Source)**
- **Context**: Site foreman sending updates throughout the day via WhatsApp
- **Scenario**: Takes photos at 9 AM during work, sends detailed voice notes at 7 PM from van
- **Communication Pattern**: "30 cube of 804 at chainage 2+750" - uses specific construction terminology
- **Need**: His information must be accurately captured despite thick Irish accent
- **Solution**: ✅ Audio normalization and enhanced pattern fixes implemented in Story 1A.2.1

**3. Small Subcontractor Owner - Mary (Early Adopter)**
- **Context**: Runs 12-person groundworks company, losing €4,000/month in unclaimed variations
- **Decision Criteria**: "If it handles Cork accents and knows 'shuttering' from 'shutters', I'll pay €249/month"
- **Success Metric**: Must see ROI within first month of use

**4. Main Contractor QS - David (Future Integration User)**
- **Context**: Reviews 15-20 variation claims weekly, rejects 40% for poor documentation
- **Need**: Professional PDF packages with clear evidence trail
- **Future Value**: API integration with main contractor systems

## Usability Goals

1. **Ease of Learning**: Complete first document within 5 minutes without training
2. **Efficiency**: Reduce documentation time from 15 hours/week to 2 hours/week  
3. **Error Prevention**: Mandatory validation for amounts >€1,000
4. **Memorability**: WhatsApp-like patterns for instant familiarity
5. **Accessibility**: Usable with work gloves and outdoor lighting

## Design Principles

1. **"Friday at 4:30 PM Ready"** - Every decision optimized for deadline pressure
2. **"Construction-Proof Simplicity"** - If it needs a manual, we've failed
3. **"Trust Through Transparency"** - Show confidence scores and processing status
4. **"Respect the Source"** - Preserve exact construction terminology and phrasing
5. **"Evidence-Grade Output"** - PDFs that QS departments take seriously
6. **"Copy-Paste Native"** - Optimize for Ctrl+C from WhatsApp, Ctrl+V to our tool
7. **"Accent-First AI"** - Irish construction terminology priority over generic accuracy
