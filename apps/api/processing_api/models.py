"""
Django models for processing API
Story 1.1 Task 6: API Documentation with OpenAPI
"""
import uuid
from django.db import models
from django.contrib.auth.models import User


class Submission(models.Model):
    """WhatsApp submission model matching Supabase schema"""
    
    PROCESSING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('transcribing', 'Transcribing'),
        ('transcribed', 'Transcribed'),
        ('extracting', 'Extracting'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    
    # Original input data
    whatsapp_text = models.TextField(blank=True, null=True)
    voice_file_path = models.TextField(blank=True, null=True)
    
    # AI processing results
    transcription = models.TextField(blank=True, null=True)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    extraction_confidence = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    extracted_data = models.JSONField(blank=True, null=True)
    
    # Processing status tracking
    processing_status = models.CharField(
        max_length=50, 
        choices=PROCESSING_STATUS_CHOICES, 
        default='pending'
    )
    processing_error = models.TextField(blank=True, null=True)
    transcription_metadata = models.JSONField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['processing_status']),
            models.Index(fields=['-processed_at']),
        ]
    
    def __str__(self):
        return f"Submission {self.id} - {self.processing_status}"