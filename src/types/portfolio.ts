export interface SemesterScore {
  semester: number;
  label: string;
  sgpa: number;
  max_scale: number;
  credits: number;
  focus: string;
}

export interface SkillArea {
  id: string;
  title: string;
  summary: string;
  python_focus: string;
  code_example: string;
  tools: string[];
}

export interface ProjectSpec {
  id: string;
  index_label: string;
  title: string;
  category: string;
  summary: string;
  role: string;
  image_path: string;
  python_component: string;
  highlights: string[];
  stack: string[];
}

export interface CertificationRecord {
  id: string;
  title: string;
  period: string;
  issuer: string;
  focus_topics: string[];
}

export interface ProfileData {
  name: string;
  headline: string;
  degree: string;
  university: string;
  year_of_study: string;
  location: string;
  email: string;
  about: string;
  availability: string;
  semesters: SemesterScore[];
  skills: SkillArea[];
  projects: ProjectSpec[];
  certifications: CertificationRecord[];
}

export interface AcademicSummary {
  current_cgpa: number;
  latest_sgpa: number;
  first_sgpa: number;
  semester_delta: number;
  percent_growth: number;
  mean_sgpa: number;
  stdev_sgpa: number;
  total_credits: number;
  completed_semesters: number;
}

export interface ForecastPoint {
  semester: number;
  label: string;
  sgpa: number;
  kind: 'completed' | 'projected';
}

export interface GpaForecast {
  target_cgpa: number;
  total_semesters: number;
  completed_semesters: number;
  remaining_semesters: number;
  required_sgpa_per_semester: number;
  achievable: boolean;
  max_possible_cgpa: number;
  trajectory: ForecastPoint[];
  summary: string;
}

export interface LanguageStat {
  language: string;
  bytes: number;
  lines: number;
  files: number;
  percentage: number;
}

export interface LanguageStatsResponse {
  total_bytes: number;
  python_percentage: number;
  languages: LanguageStat[];
}

export interface PortfolioApiResponse {
  profile: ProfileData;
  academic_summary: AcademicSummary;
  default_forecast: GpaForecast;
  transit_stops: string[];
  language_stats: LanguageStatsResponse;
  inquiries_count: number;
  runtime: {
    language: string;
    version: string;
    implementation: string;
  };
}

export interface DsaAlgorithmMeta {
  id: string;
  title: string;
  category: string;
  complexity_time: string;
  complexity_space: string;
  description: string;
  default_inputs: Record<string, unknown>;
  source_code: string;
  ast_summary: {
    source_lines: number;
    ast_nodes: number;
    loops: number;
    branches: number;
  };
}

export interface DsaRunResult {
  algorithm_id: string;
  title: string;
  complexity_time: string;
  complexity_space: string;
  elapsed_microseconds: number;
  inputs: Record<string, unknown>;
  output: Record<string, unknown>;
  trace: string[];
  ast_summary: {
    source_lines: number;
    ast_nodes: number;
    loops: number;
    branches: number;
  };
}

export interface TransitRouteResult {
  found: boolean;
  start?: string;
  destination?: string;
  total_minutes?: number;
  stops_count?: number;
  path?: string[];
  segments?: Array<{
    from: string;
    to: string;
    minutes: number;
    shuttle: string;
  }>;
  departures_at_origin?: Array<{
    route: string;
    next_bus: string;
    destination: string;
    status: string;
  }>;
  elapsed_microseconds?: number;
  error?: string;
}
