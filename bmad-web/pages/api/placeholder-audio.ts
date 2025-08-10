import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Generate a short silence WAV file (1 second of silence)
  const sampleRate = 44100;
  const duration = 1; // 1 second
  const numSamples = sampleRate * duration;
  
  // WAV header (44 bytes)
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + numSamples * 2, 4); // File size - 8
  header.write('WAVE', 8);
  
  // fmt subchunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20);  // AudioFormat (PCM)
  header.writeUInt16LE(1, 22);  // NumChannels (mono)
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  header.writeUInt16LE(2, 32);  // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample
  
  // data subchunk
  header.write('data', 36);
  header.writeUInt32LE(numSamples * 2, 40); // Subchunk2Size
  
  // Generate silence data (all zeros)
  const silenceData = Buffer.alloc(numSamples * 2, 0);
  
  // Combine header and data
  const wavFile = Buffer.concat([header, silenceData]);
  
  // Set appropriate headers
  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Content-Length', wavFile.length);
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
  
  // Return the WAV file
  res.status(200).send(wavFile);
}