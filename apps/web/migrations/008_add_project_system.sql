-- Story 1.3: Add Project Management System
-- Creates the project structure for organizing WhatsApp messages

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_name_per_company UNIQUE (company_id, name)
);

-- Create WhatsApp messages table linked to projects
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    raw_content TEXT,
    sender_name VARCHAR(255),
    message_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'voice', 'image', 'document')),
    media_url TEXT,
    processed BOOLEAN DEFAULT FALSE,
    processing_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add project_id to existing whatsapp_submissions table
ALTER TABLE whatsapp_submissions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_project_id ON whatsapp_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(message_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_submissions_project_id ON whatsapp_submissions(project_id);

-- Create RLS policies for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects from their company" ON projects
    FOR SELECT USING (
        company_id IN (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins and PMs can manage projects" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND company_id = projects.company_id 
            AND role IN ('admin', 'pm')
        )
    );

-- Create RLS policies for whatsapp_messages
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their company projects" ON whatsapp_messages
    FOR SELECT USING (
        project_id IN (
            SELECT p.id 
            FROM projects p
            JOIN users u ON p.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to their company projects" ON whatsapp_messages
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT p.id 
            FROM projects p
            JOIN users u ON p.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

-- Update existing submissions to link to projects if needed
COMMENT ON TABLE projects IS 'Project management system for organizing construction site communications';
COMMENT ON TABLE whatsapp_messages IS 'WhatsApp messages linked to specific projects for better organization';
COMMENT ON COLUMN projects.metadata IS 'JSON structure: {contractValue?: number, mainContractor?: string, projectCode?: string}';
COMMENT ON COLUMN whatsapp_messages.processing_metadata IS 'JSON structure: {voiceDuration?: number, fileSize?: number}';