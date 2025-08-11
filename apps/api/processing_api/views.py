"""
Views for processing API
Story 1.1 Task 6: API Documentation with OpenAPI
"""
from django.http import JsonResponse
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Submission
from .serializers import SubmissionSerializer


@extend_schema(
    summary="Health check endpoint",
    description="Returns the API health status",
    responses={200: {"type": "object", "properties": {"status": {"type": "string"}}}}
)
@api_view(['GET'])
def health_check(request):
    """Health check endpoint for monitoring"""
    return Response({"status": "healthy", "service": "BMAD API"})


@extend_schema(
    summary="List all submissions",
    description="Get a paginated list of all WhatsApp submissions for the authenticated user"
)
class SubmissionListView(generics.ListAPIView):
    """List all submissions for the authenticated user"""
    serializer_class = SubmissionSerializer
    
    def get_queryset(self):
        # Filter by authenticated user when authentication is implemented
        return Submission.objects.all()


@extend_schema(
    summary="Get submission details",
    description="Retrieve detailed information about a specific submission"
)
class SubmissionDetailView(generics.RetrieveAPIView):
    """Get details of a specific submission"""
    serializer_class = SubmissionSerializer
    queryset = Submission.objects.all()


@extend_schema(
    summary="Process audio submission",
    description="Submit audio for processing and transcription",
    request=SubmissionSerializer,
    responses={201: SubmissionSerializer}
)
class ProcessAudioView(generics.CreateAPIView):
    """Process new audio submission"""
    serializer_class = SubmissionSerializer
    
    def perform_create(self, serializer):
        # Add user association when authentication is implemented
        serializer.save()