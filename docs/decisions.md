# Project Decisions & Lessons Learned

## Purpose
Simple log of architectural decisions and lessons learned to prevent repeating mistakes. Append-only format for easy maintenance.

## Format
```markdown
## Story X.Y - [Decision Topic]
- **Choice**: [What was chosen]
- **Why**: [Reasoning for choice]  
- **Lesson**: [Key takeaway for future]
- **Date**: [When decided]
```

---

## Story 1.2 - Supabase Authentication Package Choice
- **Choice**: `@supabase/ssr` package instead of `@supabase/auth-helpers-nextjs`
- **Why**: auth-helpers-nextjs is officially deprecated by Supabase
- **Lesson**: Always check package deprecation status before implementation
- **Date**: 2025-01-12

## BMAD Method Enhancement - Smart Story Creation
- **Choice**: Minimal integration of story enhancement engine
- **Why**: Preserve BMAD principles while adding smart guidance for complex stories
- **Lesson**: Enhance existing workflow rather than creating new processes
- **Date**: 2025-01-12

---

## Instructions for Future Entries
1. Add new entries at the bottom
2. Keep format consistent for easy scanning
3. Focus on decisions that affect multiple stories
4. Include enough context for future reference