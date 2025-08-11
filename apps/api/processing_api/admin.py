"""
Admin configuration for processing API
"""
from django.contrib import admin
from .models import Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 
        'user', 
        'processing_status', 
        'confidence_score',
        'created_at',
        'completed_at'
    ]
    list_filter = [
        'processing_status',
        'created_at',
        'completed_at',
    ]
    search_fields = [
        'user__email',
        'whatsapp_text',
        'transcription',
    ]
    readonly_fields = [
        'id',
        'created_at',
        'updated_at',
    ]
    
    fieldsets = [
        (None, {
            'fields': ('id', 'user', 'processing_status')
        }),
        ('Input Data', {
            'fields': ('whatsapp_text', 'voice_file_path')
        }),
        ('Processing Results', {
            'fields': (
                'transcription',
                'confidence_score',
                'extraction_confidence',
                'extracted_data',
                'processing_error',
                'transcription_metadata',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
                'processed_at',
                'completed_at',
            )
        }),
    ]