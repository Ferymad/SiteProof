# API Specification

## REST API Overview

```yaml
openapi: 3.0.0
info:
  title: Construction Evidence Machine API
  version: 1.0.0
  description: API for construction evidence processing and management
servers:
  - url: https://api.constructionevidence.ie/v1
    description: Production server
  - url: http://localhost:8000/api/v1
    description: Development server

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []

paths:
  # Authentication
  /auth/register:
    post:
      summary: Register new company and admin user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [company_name, email, password, company_type]
              properties:
                company_name: { type: string }
                email: { type: string, format: email }
                password: { type: string, minLength: 8 }
                company_type: { type: string, enum: [subcontractor, main_contractor] }
      responses:
        201:
          description: Registration successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  user: { $ref: '#/components/schemas/User' }
                  token: { type: string }

  # Projects
  /projects:
    get:
      summary: List company projects
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 20 }
      responses:
        200:
          description: Project list
          content:
            application/json:
              schema:
                type: object
                properties:
                  results: 
                    type: array
                    items: { $ref: '#/components/schemas/Project' }
                  count: { type: integer }
                  next: { type: string, nullable: true }
    
    post:
      summary: Create new project
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProjectCreate'
      responses:
        201:
          description: Project created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Project'

  # WhatsApp Processing
  /projects/{project_id}/messages:
    post:
      summary: Submit WhatsApp messages for processing
      parameters:
        - name: project_id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                text_content: { type: string }
                voice_files: 
                  type: array
                  items: { type: string, format: binary }
                images:
                  type: array
                  items: { type: string, format: binary }
      responses:
        202:
          description: Processing started
          content:
            application/json:
              schema:
                type: object
                properties:
                  processing_id: { type: string }
                  message: { type: string }

  # Evidence Packages
  /projects/{project_id}/evidence-packages:
    get:
      summary: List evidence packages for project
      parameters:
        - name: project_id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        200:
          description: Evidence package list
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/EvidencePackage' }
    
    post:
      summary: Generate new evidence package
      parameters:
        - name: project_id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [date_range_start, date_range_end]
              properties:
                date_range_start: { type: string, format: date }
                date_range_end: { type: string, format: date }
      responses:
        201:
          description: Package generation started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EvidencePackage'

  # Validation Queue
  /validation/queue:
    get:
      summary: Get validation queue items
      description: For validators to retrieve pending validation tasks
      parameters:
        - name: status
          in: query
          schema: { type: string, enum: [pending, assigned, completed] }
      responses:
        200:
          description: Validation queue items
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/ValidationQueueItem' }

  /validation/queue/{queue_id}:
    patch:
      summary: Update validation item
      parameters:
        - name: queue_id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                corrected_transcription: { type: string }
                corrected_data: { type: object }
                validation_status: { type: string, enum: [validated, rejected] }
      responses:
        200:
          description: Validation updated

  # WebSocket Events (via Supabase Realtime)
  /realtime:
    description: |
      Real-time updates via Supabase Realtime subscriptions:
      - processing.status: Processing progress updates
      - validation.assigned: New validation task assigned
      - package.ready: Evidence package generation complete
```
