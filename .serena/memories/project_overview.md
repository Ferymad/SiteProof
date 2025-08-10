# BMAD-Explore Project Overview

## Project Purpose
BMAD-Explore is a Construction Intelligence Platform focused on Irish construction subcontractors. The platform reduces PM routine documentation time from 15 hours/week to 2 hours/week through AI-assisted organization of site communications.

## Tech Stack
- **Frontend**: Next.js 14.2.0 with React 18.2.0, TypeScript 5.0
- **Styling**: Tailwind CSS 3.3.0 with PostCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with UI React components
- **AI Services**: OpenAI API (Whisper for transcription, GPT-4 for processing)
- **Testing**: Jest 29.7.0 with Testing Library, JSdom environment
- **Build**: Next.js with SWC compiler

## Architecture Structure
- `/bmad-web/` - Main Next.js application
- `/bmad-web/pages/` - Next.js pages and API routes
- `/bmad-web/components/` - React components
- `/bmad-web/lib/` - Shared utilities and services
- `/bmad-web/lib/services/` - Business logic services
- `/docs/` - Comprehensive project documentation

## Current MVP Implementation Status
- Story 1A.2.1: ✅ Critical Transcription Accuracy Enhancement (COMPLETED)
- Story 1A.2.2: ✅ Interactive Unit Disambiguation Layer (COMPLETED)
- Story 1A.3: Evidence Package Generation (NEXT - BLOCKED by architecture issue)

## Business Goals
- Target: €35K monthly recurring revenue (100 customers) within 18 months
- Phase 1: Convert daily site communications into structured documentation
- Validation through own company deployment before external customer acquisition