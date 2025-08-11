"""
Serializers for processing API
Story 1.1 Task 6: API Documentation with OpenAPI
"""
from rest_framework import serializers
from .models import Submission


class SubmissionSerializer(serializers.ModelSerializer):
    """Serializer for WhatsApp submissions"""
    
    class Meta:
        model = Submission
        fields = [
            'id',
            'whatsapp_text',
            'voice_file_path',
            'transcription',
            'confidence_score',
            'extraction_confidence',
            'extracted_data',
            'processing_status',
            'processing_error',
            'transcription_metadata',
            'created_at',
            'updated_at',
            'processed_at',
            'completed_at',
        ]
        read_only_fields = [
            'id',
            'transcription',
            'confidence_score',
            'extraction_confidence',
            'extracted_data',
            'processing_status',
            'processing_error',
            'transcription_metadata',
            'created_at',
            'updated_at',
            'processed_at',
            'completed_at',
        ]


class SubmissionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new submissions"""
    
    class Meta:
        model = Submission
        fields = [
            'whatsapp_text',
            'voice_file_path',
        ]
        
    def validate(self, data):
        """Ensure either text or voice file is provided"""
        if not data.get('whatsapp_text') and not data.get('voice_file_path'):
            raise serializers.ValidationError(
                "Either whatsapp_text or voice_file_path must be provided"
            )
        return data