# SiteProof AI Processing Test Data
## Story 1A.2: Construction Terminology Testing

Use these sample inputs to test the AI processing functionality:

## Test Case 1: Basic Construction WhatsApp Messages

**WhatsApp Text Input:**
```
Hey John, need to order materials for the foundation pour tomorrow. 
We'll need 15 cubic meters of concrete, 2 tonnes of rebar, 
and 200 concrete blocks. Total cost around €3,500. 
The scaffolding arrived this morning but needs inspection.
Weather looks good for the pour.
```

**Expected Extractions:**
- **Amounts**: €3,500, 15 cubic meters, 2 tonnes, 200 blocks
- **Materials**: concrete, rebar, concrete blocks, scaffolding
- **Dates**: tomorrow, this morning
- **Safety**: scaffolding needs inspection
- **Work Status**: foundation pour planned

## Test Case 2: Irish Construction Site Voice Note Script

**Voice Note Script (read aloud for transcription):**
```
"Right, so we're after finishing the first floor slab today. 
Used about twenty-three cubic meters of concrete, 
cost us around four thousand euro. 
Need to get the steel fixers in tomorrow for the columns. 
Weather's been brutal - rain delayed us two days. 
Safety lads flagged the edge protection on the east side, 
needs sorting before Monday. 
The foreman reckons we'll have the frame up by end of next week 
if the materials arrive on time."
```

**Expected Extractions:**
- **Amounts**: €4,000, 23 cubic meters
- **Materials**: concrete, steel
- **Dates**: today, tomorrow, Monday, next week
- **Safety**: edge protection flagged
- **Work Status**: first floor slab complete, frame scheduled

## Test Case 3: Complex Mixed Input

**WhatsApp Text:**
```
Site update - Block B foundations complete. 
Ordered materials for next phase:
- 45m³ ready mix concrete: €2,800
- 150 steel mesh sheets: €1,200  
- Waterproofing membrane: €850
Delivery scheduled for Friday morning.
```

**Voice Note Script:**
```
"Update on Block B - foundations are done, 
passed inspection yesterday. 
Concrete supplier confirmed delivery for Friday, 
but there's a safety issue with the crane access road. 
Need to get that sorted before the pour on Monday. 
Weather forecast looks decent for early next week."
```

**Expected Combined Extractions:**
- **Amounts**: €2,800, €1,200, €850, 45m³, 150 sheets
- **Materials**: concrete, steel mesh, waterproofing membrane
- **Dates**: Friday morning, yesterday, Monday, next week
- **Safety**: crane access road issue
- **Work Status**: Block B foundations complete and inspected

## Testing Instructions

1. **Start the development server**: `npm run dev`
2. **Create a test account** and log in
3. **Submit one of the test cases** above
4. **Click "Process with AI"** and wait for results
5. **Check confidence scores** - should be 80%+ for clear input
6. **Verify extracted data** matches expected results
7. **Test error handling** by submitting empty data

## Expected Confidence Levels

- **High (85%+)**: Clear audio, construction terms present
- **Medium (60-84%)**: Some background noise or unclear terms
- **Low (<60%)**: Poor audio quality or no construction context

## Common Irish Construction Terms the AI Should Recognize

- **Materials**: concrete, cement, sand, aggregate, rebar, steel, timber, blocks, bricks
- **Measurements**: cubic meters (m³), tonnes, millimeters (mm), meters (m)
- **Currency**: euros (€), pounds (£)  
- **Equipment**: crane, excavator, dumper, scaffolding, formwork
- **Processes**: pour, cure, strip, fix, erect, install
- **Safety**: PPE, harness, barriers, inspection, certification

## Story 1A.2 Success Criteria

✅ Transcription accuracy >85% for clear Irish construction audio
✅ Extraction identifies all major amounts and materials
✅ Confidence scoring reflects processing quality
✅ Error handling provides user-friendly messages
✅ Processing time <60 seconds for typical voice notes
✅ UI clearly displays results and confidence levels