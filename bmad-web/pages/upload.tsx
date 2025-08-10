import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface UploadState {
  isDragging: boolean;
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: ProcessResult | null;
}

interface ProcessResult {
  success: boolean;
  submissionId?: string;
  transcription?: string;
  confidence?: number;
  duration?: number;
  validationUrl?: string;
  error?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>({
    isDragging: false,
    isUploading: false,
    progress: 0,
    error: null,
    result: null
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: false }));
    
    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => 
      file.type.startsWith('audio/') || 
      file.type.startsWith('video/') ||
      ['.mp3', '.wav', '.m4a', '.ogg', '.webm'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );

    if (audioFile) {
      processAudioFile(audioFile);
    } else {
      setState(prev => ({ 
        ...prev, 
        error: 'Please select an audio file (MP3, WAV, M4A, OGG, WebM)' 
      }));
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAudioFile(file);
    }
  }, []);

  const processAudioFile = async (file: File) => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true, 
      progress: 0, 
      error: null, 
      result: null 
    }));

    try {
      console.log('🚀 Processing audio file:', file.name);

      const formData = new FormData();
      formData.append('audio', file);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 50); // 50% for upload
          setState(prev => ({ ...prev, progress }));
        }
      };

      const response = await new Promise<Response>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setState(prev => ({ ...prev, progress: 50 })); // Upload complete
            resolve(new Response(xhr.response, { 
              status: xhr.status, 
              statusText: xhr.statusText 
            }));
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('POST', '/api/process-audio');
        xhr.send(formData);
      });

      // Simulate transcription progress
      setState(prev => ({ ...prev, progress: 75 }));
      
      const result = await response.json();
      setState(prev => ({ ...prev, progress: 100 }));

      if (result.success) {
        console.log('✅ Processing completed:', result);
        setState(prev => ({ 
          ...prev, 
          result, 
          isUploading: false 
        }));
      } else {
        throw new Error(result.error || 'Processing failed');
      }

    } catch (error) {
      console.error('❌ Processing error:', error);
      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0 
      }));
    }
  };

  const goToValidation = () => {
    if (state.result?.submissionId) {
      router.push(`/validation?id=${state.result.submissionId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Head>
        <title>Audio Upload - BMAD Construction</title>
        <meta name="description" content="Upload audio for AI-powered transcription validation" />
      </Head>

      <div className="max-w-2xl mx-auto px-4">
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          
          <button
            onClick={() => router.push('/results')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            📊 View Results
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎙️ Audio Transcription
          </h1>
          <p className="text-gray-600">
            Upload construction site audio for AI-powered transcription and validation
          </p>
        </div>

        {!state.result && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              state.isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${state.isUploading ? 'pointer-events-none opacity-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {state.isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <div className="space-y-2">
                  <div className="text-lg font-medium text-gray-900">
                    Processing Audio... {state.progress}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${state.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {state.progress < 50 ? 'Uploading...' :
                     state.progress < 100 ? 'Transcribing with AI...' : 'Complete!'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl mb-4">🎵</div>
                <div className="text-xl font-medium text-gray-900">
                  Drop audio file here or click to select
                </div>
                <div className="text-sm text-gray-500">
                  Supports MP3, WAV, M4A, OGG, WebM (max 10MB)
                </div>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="audio-file"
                />
                <label
                  htmlFor="audio-file"
                  className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Select Audio File
                </label>
              </div>
            )}
          </div>
        )}

        {state.error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="text-red-400 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                <div className="mt-1 text-sm text-red-700">{state.error}</div>
                <button
                  onClick={() => setState(prev => ({ ...prev, error: null }))}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {state.result && state.result.success && (
          <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="text-green-400 text-xl mr-3">✅</div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-green-800 mb-3">
                  Transcription Complete!
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded border">
                    <div className="text-sm font-medium text-gray-700 mb-2">Transcription:</div>
                    <div className="text-gray-900">{state.result.transcription}</div>
                  </div>
                  
                  <div className="flex space-x-4 text-sm text-gray-600">
                    <span>Confidence: {state.result.confidence?.toFixed(1)}%</span>
                    {state.result.duration && (
                      <span>Duration: {state.result.duration.toFixed(1)}s</span>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-x-3">
                  <button
                    onClick={goToValidation}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Review & Validate →
                  </button>
                  <button
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      result: null, 
                      error: null, 
                      progress: 0 
                    }))}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <div className="text-sm text-gray-500">
            <p>🔒 Your audio is processed securely and deleted after transcription</p>
            <p>🤖 Powered by OpenAI Whisper + Construction-specific AI fixes</p>
          </div>
        </div>
      </div>
    </div>
  );
}