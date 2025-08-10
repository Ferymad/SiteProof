#!/bin/bash
# Simple API Testing Script
# Run: bash test-api-simple.sh

echo "================================"
echo "BMAD API ENDPOINT TESTING"
echo "================================"

BASE_URL="http://localhost:3000/api"

echo -e "\n1. Testing Validation Session Endpoint..."
curl -X GET "$BASE_URL/validation/session/mock-123" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | head -20

echo -e "\n2. Testing Smart Suggestions Endpoint..."
curl -X POST "$BASE_URL/test/smart-suggestions" \
  -H "Content-Type: application/json" \
  -d '{"text":"delivery at 30 and safe farming"}' \
  -w "\nStatus: %{http_code}\n" \
  -s | head -20

echo -e "\n3. Testing Processing Transcribe..."
curl -X POST "$BASE_URL/processing/transcribe" \
  -H "Content-Type: application/json" \
  -d '{"audio":"test","submissionId":"test-123"}' \
  -w "\nStatus: %{http_code}\n" \
  -s | head -20

echo -e "\n================================"
echo "Tests complete!"