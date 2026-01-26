// Types for CV Analyzer feature

export interface CVAnalysisWeakness {
    section: string;
    issue: string;
    priority: number;
    suggestion: string;
}

export interface CVRedFlag {
    category: 'content' | 'format' | 'gaps' | 'language';
    severity: 'high' | 'medium' | 'low';
    issue: string;
    suggestion: string;
    location?: string; // Optional: specific section where the issue was found
}

export interface CVAnalysisResult {
    score: number;
    strengths: string[];
    weaknesses: CVAnalysisWeakness[];
    red_flags?: CVRedFlag[]; // Critical issues that cause immediate rejection
    suggestions_by_section: {
        [sectionName: string]: string[];
    };
    rewritten_sections: {
        [sectionName: string]: string;
    };
    extracted_contacts?: {
        email?: string;
        phone?: string;
    };
    notes?: string;
    structured_cv?: {
        personal_info: {
            name: string;
            role: string;
            location: string;
            linkedin: string;
        };
        summary: string;
        experience: {
            company: string;
            role: string;
            period: string;
            description: string;
        }[];
        education: {
            institution: string;
            degree: string;
            period: string;
        }[];
        skills: string[];
    };
}

export interface ResumeAnalysis {
    id: string;
    user_id: string;
    file_path: string | null;
    filename: string;
    file_size: number;
    file_type: 'pdf' | 'docx';
    content_text: string | null;
    analysis_result: CVAnalysisResult;
    score: number;
    opt_in_save: boolean;
    created_at: string;
    expires_at: string;
    status: 'processing' | 'completed' | 'failed';
}

export interface CVUploadData {
    file: File;
    optInSave: boolean;
    targetCareer?: string;
}

export interface CVUsageQuota {
    current_month: string;
    analyses_count: number;
    max_analyses: number;
    can_analyze: boolean;
}

// ========================================
// CV Enhancement Types
// ========================================

// Quality rating types (replaces numeric scores in UI)
export type QualityRating = 'excellent' | 'very_good' | 'good' | 'fair' | 'needs_improvement';

export interface QualityInfo {
    rating: QualityRating;
    label: string;
    color: string;
    bgColor: string;
}

// Dynamic Section Types
export type SectionType = 'personal' | 'richtext' | 'repeatable_group' | 'list' | 'custom';

export interface FieldMetadata {
    source: 'parsed:file' | 'user-edited';
    timestamp: number;
}

export interface SectionItem {
    id: string;
    [key: string]: any; // Dynamic fields
    _meta?: Record<string, FieldMetadata>;
}

export interface ResumeItem extends SectionItem {
    title: string;
    subtitle?: string;
    date?: string;
    description?: string;
}

export interface ReferenceItem extends SectionItem {
    name: string;
    role?: string;
    company?: string;
    contact?: string;
}

export interface Section {
    id: string;
    type: SectionType;
    title: string;
    visible: boolean;
    collapsed: boolean;
    isCustom?: boolean;
    /**
     * For repeatable sections (experience/education/courses), controls whether items are
     * auto-sorted by date or manually sorted via drag-and-drop.
     */
    sortMode?: 'auto' | 'manual';
    items?: SectionItem[];
    content?: string;
    list?: string[];
    fields?: Record<string, any>;
    _meta?: Record<string, FieldMetadata>;
}

export interface EditableCV {
    id: string;
    sections: Section[];
    metadata: {
        template: string;
        lastUpdated: string;
        targetCareer?: string;
        analysisId?: string;
    };
    _parseWarnings?: string[];
}

export interface CVAnalysis {
    overall_score: number;
    sections: {
        name: string;
        score: number;
        strengths: string[];
        weaknesses: string[];
        suggestions: string[];
    }[];
    summary: string;
    red_flags?: CVRedFlag[];
    extracted_contacts?: {
        email?: string;
        phone?: string;
    };
    structured_cv?: {
        personal_info: {
            name: string;
            role: string;
            location: string;
            linkedin: string;
        };
        summary: string;
        experience: {
            company: string;
            role: string;
            period: string;
            description: string;
        }[];
        education: {
            institution: string;
            degree: string;
            period: string;
        }[];
        skills: string[];
    };
    suggestions_by_section?: Record<string, string[]>;
    rewritten_sections?: Record<string, string>;
}
