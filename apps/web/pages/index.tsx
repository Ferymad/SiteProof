import React from 'react'
import Link from 'next/link'
import Head from 'next/head'

export default function HomePage() {
  return (
    <>
      <Head>
        <title>BMAD Construction - AI Audio Transcription</title>
        <meta name="description" content="AI-powered audio transcription for Irish construction sites with construction-specific fixes and safety terminology corrections" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🏗️ BMAD Construction
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-Powered Audio Transcription for Construction Sites
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Upload audio from Irish construction sites and get accurate, validated transcriptions 
            with construction-specific fixes and safety terminology corrections.
          </p>
        </div>

        {/* Main Action */}
        <div className="text-center mb-12">
          <Link href="/upload" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors shadow-lg">
            🎙️ Upload Audio File
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* How it Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Simple 4-Step Process
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📤</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Upload</h3>
              <p className="text-gray-600 text-sm">
                Drag & drop your audio file (.mp3, .wav, .m4a)
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Transcribe</h3>
              <p className="text-gray-600 text-sm">
                AI processes audio with construction-specific fixes
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Validate</h3>
              <p className="text-gray-600 text-sm">
                Review and approve AI suggestions with audio playback
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💾</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">4. Results</h3>
              <p className="text-gray-600 text-sm">
                Download final transcription and access history
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Built for Construction
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">🇮🇪 Irish Construction Optimized</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Time fixes: "at 30" → "at 8:30"</li>
                <li>• Safety terms: "safe farming" → "safe working"</li>
                <li>• Currency: "50 pounds" → "50 euros"</li>
                <li>• Materials: C25/30, DPC, 804 stone</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">⚡ Fast & Accurate</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• &lt;2 minute validation time</li>
                <li>• 85%+ transcription accuracy</li>
                <li>• Mobile-friendly interface</li>
                <li>• Instant audio playback</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="text-center space-y-4">
          <div className="space-x-4">
            <Link href="/results" className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
              📊 View Previous Results
            </Link>
            
            <Link href="/validation" className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
              👁️ Validation Tool Demo
            </Link>
          </div>
          
          <p className="text-sm text-gray-500">
            Need help? Check the <Link href="#" className="text-blue-600 hover:underline">setup guide</Link> or 
            <Link href="#" className="text-blue-600 hover:underline"> contact support</Link>
          </p>
        </div>
      </div>
    </div>
    </>
  )
}