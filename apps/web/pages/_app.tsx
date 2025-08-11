import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { AuthProvider } from '@/contexts/AuthContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>BMAD Construction - Evidence Platform</title>
        <meta name="description" content="AI-powered construction evidence collection and processing for site communications" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  )
}