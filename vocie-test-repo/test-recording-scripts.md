# Construction Voice Recording Test Scripts

## Instructions for Test Recordings

**Purpose**: Test our AI transcription system with real Irish construction scenarios

**How to Record**:
1. Use WhatsApp voice notes or any voice recorder
2. Speak naturally as you would on site (don't slow down or over-pronounce)
3. Include background noise if on actual site
4. Each recording should be 30-60 seconds
5. Save files with descriptive names (e.g., "material-order-concrete.mp3")

---

## SCENARIO 1: Material Order (Morning Call to Supplier)

**Context**: You're calling to order materials for tomorrow's pour

**Script Guide** (adapt to your natural speech):
```
Morning, need to order materials for the Ballymun site.
We'll need 15 cubic meters of C30/35 ready mix for tomorrow at 8.
Also need 2 tonnes of rebar, the 12mm stuff.
Can you deliver by half 7? The pour starts at 8 sharp.
Total should be around 2850 euro including delivery.
Ring me back on this number to confirm.
```

**Key Test Elements**: 
- Time disambiguation (8 = 8:00 AM)
- Concrete grade (C30/35)
- Currency (euros not pounds)
- Irish time expressions ("half 7")

---

## SCENARIO 2: Daily Time Tracking (Evening Update)

**Context**: Reporting today's work hours for dayworks claim

**Script Guide**:
```
Quick update on today's dayworks.
Had 8 lads on site from 7 this morning.
2 of them knocked off at 3 for the dentist.
The rest worked through till half 5.
That's 8 hours for 6 lads, and 8 hours for 2 lads... no wait, 
the 2 lads only did 8... sorry, from 7 to 3, that's 8 hours.
Will send the sheets tomorrow.
```

**Key Test Elements**:
- Multiple time references
- Number confusion (8 lads vs 8 hours)
- Self-correction in speech
- Irish expressions ("knocked off")

---

## SCENARIO 3: Safety Incident Report

**Context**: Reporting a near-miss incident

**Script Guide**:
```
Had a near miss this morning around 10.
One of the lads nearly fell from the scaffold.
The edge protection wasn't properly secured.
Nobody hurt but could've been serious.
Need to get 10 more harnesses for the crew.
Already did the toolbox talk about working at height.
Will file the report before 5 today.
```

**Key Test Elements**:
- "Edge protection" (often mis-heard as "engine protection")
- Time vs quantity (10 o'clock vs 10 harnesses)
- Safety terminology

---

## SCENARIO 4: Progress Update with Issues

**Context**: PM updating the main contractor about delays

**Script Guide**:
```
Progress update for the Collins job.
We've finished 30 percent of the ground floor slab.
Hit rock at 2 meters, wasn't on the drawings.
Going to cost an extra 5 or 6 thousand to break it out.
Can't pour till Thursday now instead of Tuesday.
Need approval for the variation before we proceed.
Weather's supposed to be good so we should catch up.
```

**Key Test Elements**:
- Percentage vs quantity
- Depth measurement
- Cost in thousands (abbreviated)
- Day names
- Technical terms (variation, slab)

---

## SCENARIO 5: Mixed Context (Thick Cork Accent)

**Context**: Foreman giving multiple updates
**Note**: Please use your natural accent, especially if you have a thick Cork/Kerry/rural accent

**Script Guide**:
```
Right, few things there now.
First, the concrete for tomorrow - need 20 cube of C25/30.
Second, Jimmy's been out since Monday with his back.
Third, we're 2 days behind but might make it up if the weather holds.
That crowd from Murphy's were here at 9 asking about the certs.
Told them we'd have everything ready by the 15th.
Cost us about 12 grand so far this month in variations.
```

**Key Test Elements**:
- Multiple contexts in one message
- Accent challenges
- Date references (15th)
- Company names
- Informal measurements ("20 cube")

---

## SCENARIO 6: Technical Discussion with Quantities

**Context**: Discussing reinforcement requirements

**Script Guide**:
```
Checked the drawings there for the pile caps.
Need A393 mesh for the top and bottom.
That's 50 sheets altogether.
The main bars are 25mm diameter, 3 meters long.
Spacing at 200 centers both ways.
Links are 10mm at 150 centers.
Should take 3 days with 4 steel fixers.
```

**Key Test Elements**:
- Technical specifications (A393, 25mm)
- Not confusing specifications with quantities
- Construction abbreviations
- Multiple number contexts

---

## SCENARIO 7: WhatsApp Voice Note (Very Casual)

**Context**: Quick voice note to your PM while walking on site

**Script Guide**:
```
*[Background noise of machinery]*
Yeah, just there at the site now.
That thing we talked about yesterday... the, eh... 
the blockwork, yeah.
They've done about... I'd say 500 blocks so far.
Should be finished by, what... Thursday, Friday latest.
Oh, and tell John his 30 grand came through.
*[Someone shouts in background]*
Sorry, hang on... YEAH, PUT IT OVER THERE!
Right, anyway, give me a shout when you get this.
```

**Key Test Elements**:
- Interruptions and background noise
- Incomplete thoughts
- Casual speech patterns
- Money without currency symbol

---

## CRITICAL NUMBERS TEST

**Purpose**: Test how AI handles ambiguous numbers

Record these exact phrases:
1. "Starting at 8" → Should be: 8:00 AM
2. "8 tonnes of sand" → Should be: 8 tonnes (quantity)
3. "That'll be 8 thousand" → Should be: €8,000
4. "On the 8th of March" → Should be: March 8th (date)
5. "8 of the lads" → Should be: 8 workers
6. "About 8 or 9 hours" → Should be: 8-9 hours (duration)

---

## REAL ERROR EXAMPLES TO TEST

Based on actual system failures, please record these:

1. **Original**: "Concrete delivery at 30"
   **Should become**: "Concrete delivery at 8:30"

2. **Original**: "Cost 2850 pounds" 
   **Should become**: "Cost €2,850"

3. **Original**: "C twenty five thirty concrete"
   **Should become**: "C25/30 concrete"

4. **Original**: "Working on the forest lab"
   **Should become**: "Working on the floor slab"

---

## SUBMISSION INSTRUCTIONS

1. Record each scenario as a separate voice note
2. Name files clearly: `scenario1-material-order.mp3`
3. Include your accent type in filename if strong: `scenario5-cork-accent.mp3`
4. Send via WhatsApp or email
5. Note any specific words you think the AI might struggle with

**Goal**: Collect 20-30 varied recordings to improve our system's accuracy for Irish construction workers.

Thank you for helping us build better tools for the industry! 🏗️