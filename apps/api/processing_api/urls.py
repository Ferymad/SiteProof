"""
URLs for processing API endpoints
"""
from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('submissions/', views.SubmissionListView.as_view(), name='submission_list'),
    path('submissions/<uuid:pk>/', views.SubmissionDetailView.as_view(), name='submission_detail'),
    path('process/', views.ProcessAudioView.as_view(), name='process_audio'),
]