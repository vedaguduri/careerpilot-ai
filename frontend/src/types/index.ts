export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at?: string;
}

export interface UserPreference {
  id?: string;
  desired_roles: string[];
  preferred_locations: string[];
  experience_level: string;
  work_arrangements: string[];
  min_salary?: number;
  preferred_currency?: string;
  preferred_industries?: string[];
  target_companies?: string[];
  discovery_frequency_hours?: number;
}

export interface JobMatchInfo {
  overall_score: number;
  skills_score?: number;
  matching_skills: string[];
  missing_required_skills: string[];
  scoring_breakdown?: any;
}

export interface Job {
  id: string;
  external_id: string;
  source: string;
  source_url: string;
  application_url: string;
  title: string;
  company: string;
  company_logo_url?: string;
  location: string;
  country: string;
  work_arrangement: 'remote' | 'hybrid' | 'onsite';
  employment_type: string;
  min_salary?: number;
  max_salary?: number;
  salary_currency?: string;
  description: string;
  extracted_skills: string[];
  required_experience_years?: number;
  posted_at?: string;
  first_seen_at?: string;
  availability_status: 'active' | 'unverified' | 'closed';
  match?: JobMatchInfo;
}

export interface MasterResumeAST {
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    portfolio?: string;
  };
  professional_summary: string;
  skills: string[];
  work_experience: Array<{
    company: string;
    role: string;
    location: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    highlights: string[];
    technologies: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    start_year: string;
    end_year: string;
    gpa?: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    highlights: string[];
    technologies: string[];
    url?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
    url?: string;
  }>;
}

export interface MasterResume {
  id: string;
  file_name: string;
  file_type: string;
  raw_text?: string;
  structured_data: MasterResumeAST;
  version_number: number;
  created_at: string;
  updated_at: string;
}

export interface DiffItem {
  id: string;
  section: string;
  original: string;
  proposed: string;
  reason: string;
  matched_keyword: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface TailoredResume {
  id: string;
  job_id: string;
  master_resume_id: string;
  version_name: string;
  tailored_structured_data: MasterResumeAST;
  diff_summary: DiffItem[];
  latex_source: string;
  pdf_file_path?: string;
  compilation_status: string;
  created_at: string;
}

export interface ApplicationRecord {
  id: string;
  job_id: string;
  tailored_resume_id?: string;
  status: 'interested' | 'saved' | 'preparing' | 'applied' | 'assessment' | 'interview' | 'rejected' | 'offer' | 'archived';
  applied_at?: string;
  interview_at?: string;
  notes: string;
  custom_application_url?: string;
  updated_at: string;
  job?: Job;
  tailored_resume?: {
    id: string;
    version_name: string;
    pdf_file_path?: string;
  };
}

export interface AIProviderConfig {
  id: string;
  provider: string;
  key_fingerprint: string;
  base_url?: string;
  is_active: boolean;
  selected_models: Record<string, string>;
  monthly_spend_limit_usd: number;
}
