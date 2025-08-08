# Backend Architecture

## Service Architecture

### Controller/Route Organization
```
apps/api/
├── api/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── authentication/
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── models.py
│   │   └── urls.py
│   ├── projects/
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── models.py
│   │   └── urls.py
│   ├── processing/
│   │   ├── views.py
│   │   ├── services.py           # Enhanced with audio normalization
│   │   ├── audio_normalizer.py   # NEW: Audio processing service
│   │   ├── business_risk_router.py # NEW: Business risk assessment
│   │   ├── tasks.py
│   │   └── urls.py
│   ├── validation/
│   │   ├── views.py
│   │   ├── admin.py
│   │   ├── models.py
│   │   └── urls.py
│   └── evidence/
│       ├── views.py
│       ├── builders.py
│       ├── models.py
│       └── urls.py
├── core/
│   ├── middleware/
│   ├── exceptions/
│   └── utils/
└── tests/
```

### Controller Template with Smart Routing
```python