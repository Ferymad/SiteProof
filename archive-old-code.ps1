# PowerShell Archive Script for BMAD Old Code
# Run: .\archive-old-code.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BMAD Code Archive Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create archive directory
$archiveBase = ".\archive\pre-mvp-story-1a2"
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$archiveDir = "$archiveBase-$timestamp"

Write-Host "Creating archive directory: $archiveDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $archiveDir | Out-Null
New-Item -ItemType Directory -Force -Path "$archiveDir\services" | Out-Null
New-Item -ItemType Directory -Force -Path "$archiveDir\api" | Out-Null
New-Item -ItemType Directory -Force -Path "$archiveDir\components" | Out-Null
New-Item -ItemType Directory -Force -Path "$archiveDir\stories" | Out-Null
New-Item -ItemType Directory -Force -Path "$archiveDir\tests" | Out-Null

# Define files to archive
$filesToArchive = @(
    # Services
    @{From="bmad-web\lib\services\advanced-processor.service.ts"; To="services\"},
    @{From="bmad-web\lib\services\transcription-fixer.ts"; To="services\"},
    @{From="bmad-web\lib\services\context-analyzer.service.ts"; To="services\"},
    
    # API Endpoints
    @{From="bmad-web\pages\api\processing\context-aware.ts"; To="api\"},
    @{From="bmad-web\pages\api\processing\transcribe.ts"; To="api\"},
    
    # Components
    @{From="bmad-web\components\SmartSuggestionReview.tsx"; To="components\"},
    @{From="bmad-web\components\ProcessingStatus.tsx"; To="components\"},
    
    # Tests
    @{From="bmad-web\__tests__\context-aware-processing.test.ts"; To="tests\"},
    @{From="bmad-web\__tests__\api\smart-suggestions.test.ts"; To="tests\"}
)

$successCount = 0
$skipCount = 0

Write-Host "`nArchiving files..." -ForegroundColor Yellow
Write-Host "----------------------------------------"

foreach ($file in $filesToArchive) {
    if (Test-Path $file.From) {
        $destination = Join-Path $archiveDir $file.To
        Copy-Item $file.From -Destination $destination -Force
        Write-Host "✓ Archived: $($file.From)" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "⚠ Not found: $($file.From)" -ForegroundColor Yellow
        $skipCount++
    }
}

# Create README
$readme = @"
# Archive: Pre-MVP Story 1A.2 Code
Date: $timestamp

## Reason
Story 1A.2 became overly complex. Archived as part of Clean MVP pivot (Story 1A.3).

## Files Archived
- Services: GPT-5 processing, pattern matching, context analysis
- API: Broken endpoints (context-aware, transcribe)
- Components: Duplicate UIs (SmartSuggestionReview, ProcessingStatus)
- Tests: Related test files

## Note
These files are preserved for reference only. Do not use in production.
"@

$readme | Out-File -FilePath "$archiveDir\README.md" -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ARCHIVE COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Archived: $successCount files" -ForegroundColor Green
Write-Host "⚠ Skipped: $skipCount files" -ForegroundColor Yellow
Write-Host "📁 Location: $archiveDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Review archived files"
Write-Host "2. Delete originals if satisfied"
Write-Host "3. Start Story 1A.3 implementation"