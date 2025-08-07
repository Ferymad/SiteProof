# Testing Strategy

## Testing Pyramid
```
         E2E Tests (Playwright)
        /                      \
   Integration Tests (API + UI)
      /                        \
Frontend Unit (Vitest)  Backend Unit (pytest)
```

## Test Organization

### Frontend Tests
```
apps/web/src/
├── __tests__/
│   ├── components/
│   │   ├── atoms/
│   │   ├── molecules/
│   │   └── organisms/
│   ├── pages/
│   ├── services/
│   └── utils/
```

### Backend Tests
```
apps/api/tests/
├── unit/
│   ├── test_models.py
│   ├── test_serializers.py
│   └── test_services.py
├── integration/
│   ├── test_api_endpoints.py
│   ├── test_ai_processing.py
│   └── test_webhooks.py
└── fixtures/
    ├── audio_samples/
    └── test_data.py
```

### E2E Tests
```
e2e/
├── auth.spec.ts
├── processing.spec.ts
├── validation.spec.ts
└── evidence.spec.ts
```
