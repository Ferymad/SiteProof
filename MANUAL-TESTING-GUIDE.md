# 🧪 MANUAL TESTING GUIDE - Story 1A.3 Clean MVP

## 🚀 QUICK START

### **1. Set Environment Variables**
```bash
# Create .env.local in bmad-web folder:
cd bmad-web
echo "OPENAI_API_KEY=sk-your-openai-key" > .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url" >> .env.local  
echo "SUPABASE_SERVICE_ROLE_KEY=your-supabase-key" >> .env.local
```

### **2. Start the Server**
```bash
npm run dev
# Should start on http://localhost:3000 or http://localhost:3004
```

---

## 🎯 MANUAL TEST SCENARIOS

### **TEST 1: Basic Upload & Transcription**

**Steps:**
1. Open http://localhost:3000/upload
2. Drag & drop an audio file (MP3, WAV, M4A)
3. Click "Process Audio" 
4. Wait for transcription (30-60 seconds)
5. Note the submission ID returned

**Expected Results:**
- File uploads successfully
- Real transcription appears (unique per file)
- Construction fixes applied (£→€, "at 30"→"at 8:30")
- Submission ID generated

**Test Files:** Use files from `vocie-test-repo/` folder

---

### **TEST 2: ValidationTool Workflow**

**Steps:**
1. After Test 1, copy the submission ID
2. Visit: http://localhost:3000/validation?id=YOUR_SUBMISSION_ID
3. Review the suggested corrections
4. Click "Approve", "Reject", or "Edit" on suggestions
5. Save the final validation

**Expected Results:**
- ValidationTool loads with real transcription
- Smart suggestions appear for construction terms
- Corrections can be approved/rejected
- Final text saves to database

---

### **TEST 3: Multiple File Testing**

**Steps:**
1. Upload 3 different audio files
2. Compare transcriptions - should be unique
3. Test different accents/quality levels
4. Verify each gets different suggestions

**Expected Results:**
- Each file produces different transcription
- Accuracy varies based on audio quality
- Construction fixes applied consistently

---

### **TEST 4: Error Handling**

**Test A - No API Key:**
```bash
# Remove OPENAI_API_KEY from .env.local
# Upload audio file
# Should get: "OpenAI API key not configured"
```

**Test B - Invalid File:**
```bash
# Upload a text file or image
# Should reject with file type error
```

**Test C - Large File:**
```bash  
# Upload file > 10MB
# Should reject with size limit error
```

---

## 🔍 WHAT TO LOOK FOR

### **✅ SUCCESS INDICATORS:**
- Real transcription text (not hardcoded)
- Construction terms fixed: £→€, "at 30"→"at 8:30", "safe farming"→"safe working"
- ValidationTool shows real suggestions
- Database saves final approved text
- Mobile-friendly interface (test on phone)

### **❌ FAILURE INDICATORS:**
- Same transcription for different files
- No construction fixes applied
- ValidationTool shows empty/broken data
- Server errors or crashes
- API key errors

---

## 🎵 TEST AUDIO FILES

**Located in:** `vocie-test-repo/`

**Try these test phrases:**
- "Delivery at 30 with 50 pounds of materials"
- "Safe farming practices for the foundation"
- "The project costs 100 pounds sterling"

**Expected fixes:**
- "at 30" → "at 8:30"
- "safe farming" → "safe working"  
- "pounds" → "euros"

---

## 📱 MOBILE TESTING

1. Open on phone browser: http://YOUR_IP:3000/upload
2. Test drag & drop (should work)
3. Test ValidationTool touch targets (should be 80px+)
4. Test approve/reject buttons (should be thumb-friendly)

---

## 🐛 TROUBLESHOOTING

### **Server Won't Start:**
```bash
cd bmad-web
npm install
npm run dev
```

### **API Key Errors:**
- Check .env.local exists in bmad-web folder
- Verify OPENAI_API_KEY starts with "sk-"
- Restart server after adding key

### **Supabase Errors:**
- Check Supabase project is active
- Verify database table exists: whatsapp_submissions
- Check Supabase keys in .env.local

### **Upload Fails:**
- Check file size < 10MB  
- Try different audio format (MP3, WAV)
- Check server logs for errors

---

## 🎯 CRITICAL VALIDATION POINTS

**Test these specific business requirements:**

1. **Irish Construction Accuracy:**
   - Record phrases with Irish accent
   - Verify construction terms get fixed
   - Check business risk assessment

2. **Validation Speed:**
   - Time full workflow: upload → validate → save
   - Should be < 2 minutes total

3. **Construction Term Fixes:**
   - Test all critical patterns from QA suite
   - Verify safety terminology corrections
   - Check currency conversions

4. **User Experience:**
   - Test on mobile device
   - Verify touch targets are large enough
   - Check loading states and error messages

---

## 📊 EXPECTED PERFORMANCE

- **Transcription Time:** 30-60 seconds per audio file
- **Validation Time:** < 2 minutes for typical use
- **Accuracy Target:** 85%+ on clear Irish construction audio
- **File Support:** MP3, WAV, M4A, OGG up to 10MB

---

## 🚨 STOP TESTING IF:

- Same transcription appears for different files (mock data bug)
- No construction fixes applied (smart suggestions broken)
- ValidationTool won't load (API integration broken)
- Server crashes frequently (stability issues)

**Contact Dev Agent if any critical issues found!**

---

Ready to test? Start with Test 1 - Basic Upload! 🎯