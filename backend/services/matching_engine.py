import re
from typing import Dict, Any, List
from models.matching import JobMatchScore
from models.job import Job

class MatchingEngine:
    """Calculates deterministic & explainable match scores (0-100) between a Master Resume AST and a Job."""

    @classmethod
    def calculate_match(cls, user_id: str, job: Job, master_ast: Dict[str, Any]) -> JobMatchScore:
        candidate_skills = [s.strip() for s in master_ast.get("skills", [])]
        candidate_skills_lower = {s.lower(): s for s in candidate_skills}
        
        job_skills = job.extracted_skills or []
        job_skills_lower = [s.lower() for s in job_skills]
        
        # 1. Skills Scoring (40% Weight)
        matching_skills = []
        missing_required_skills = []
        preferred_skills_possessed = []
        
        for js in job_skills:
            if js.lower() in candidate_skills_lower:
                matching_skills.append(candidate_skills_lower[js.lower()])
            else:
                missing_required_skills.append(js)
                
        # Candidate extra skills (bonus)
        for cs in candidate_skills:
            if cs.lower() not in job_skills_lower:
                preferred_skills_possessed.append(cs)
                
        if job_skills:
            skills_ratio = len(matching_skills) / len(job_skills)
            skills_score = int(round(skills_ratio * 100))
        else:
            skills_score = 80 # Default baseline if job has no explicit skill list
            
        # 2. Experience Scoring (25% Weight)
        candidate_years = cls._estimate_candidate_years(master_ast)
        job_req_years = job.required_experience_years or 3.0
        
        if candidate_years >= job_req_years:
            experience_score = 100
        else:
            # Non-punitive linear ratio with 60% floor for adjacent levels
            experience_score = max(50, int(round((candidate_years / max(1.0, job_req_years)) * 100)))
            
        # 3. Role & Seniority Relevance (20% Weight)
        candidate_summary = master_ast.get("professional_summary", "")
        role_score = cls._calculate_role_relevance(job.title, candidate_summary, master_ast)
        
        # 4. Project Relevance (15% Weight)
        relevant_projects, proj_score = cls._evaluate_projects(job_skills_lower, master_ast.get("projects", []))
        
        # Final Transparent Formula:
        # Overall = 0.40 * skills + 0.25 * experience + 0.20 * role + 0.15 * projects
        overall = int(round(
            (0.40 * skills_score) +
            (0.25 * experience_score) +
            (0.20 * role_score) +
            (0.15 * proj_score)
        ))
        overall = max(10, min(99, overall)) # Bounded between 10 and 99
        
        # Improvement suggestions
        suggestions = []
        if missing_required_skills:
            suggestions.append(f"Review core requirements for: {', '.join(missing_required_skills[:4])}.")
        if relevant_projects:
            suggestions.append(f"Highlight impact in project '{relevant_projects[0]}' during discussions.")
        if candidate_years >= job_req_years:
            suggestions.append("Your work experience exceeds the required threshold—emphasize your architecture leadership.")

        breakdown = {
            "formula": "0.40*Skills + 0.25*Experience + 0.20*RoleAlignment + 0.15*ProjectRelevance",
            "weights": {
                "skills_score": {"weight": 0.40, "score": skills_score},
                "experience_score": {"weight": 0.25, "score": experience_score},
                "role_relevance_score": {"weight": 0.20, "score": role_score},
                "project_relevance_score": {"weight": 0.15, "score": proj_score}
            },
            "candidate_years_estimated": candidate_years,
            "job_required_years": job_req_years
        }

        return JobMatchScore(
            user_id=user_id,
            job_id=job.id,
            overall_score=overall,
            skills_score=skills_score,
            experience_score=experience_score,
            role_relevance_score=role_score,
            matching_skills=matching_skills,
            missing_required_skills=missing_required_skills,
            preferred_skills_possessed=preferred_skills_possessed[:8],
            relevant_projects=relevant_projects,
            scoring_methodology_breakdown=breakdown,
            improvement_suggestions=suggestions
        )

    @staticmethod
    def _estimate_candidate_years(ast: Dict[str, Any]) -> float:
        experiences = ast.get("work_experience", [])
        if not experiences:
            return 3.0
        # Estimate roughly ~1.8 years per distinct experience block if dates unparsed
        return min(12.0, max(1.5, len(experiences) * 2.0))

    @staticmethod
    def _calculate_role_relevance(job_title: str, summary: str, ast: Dict[str, Any]) -> int:
        title_words = set(re.findall(r'\w+', job_title.lower()))
        role_tokens = {"engineer", "developer", "architect", "senior", "lead", "full", "stack", "backend", "frontend", "platform", "cloud"}
        significant_words = title_words.intersection(role_tokens)
        
        score = 65
        combined_text = (summary + " " + " ".join([e.get("role", "") for e in ast.get("work_experience", [])])).lower()
        
        matches = [w for w in significant_words if w in combined_text]
        if matches:
            score += min(30, len(matches) * 10)
        return min(100, score)

    @staticmethod
    def _evaluate_projects(job_skills_lower: List[str], projects: List[Dict[str, Any]]) -> (List[str], int):
        relevant = []
        total_hits = 0
        for p in projects:
            p_techs = [t.lower() for t in p.get("technologies", [])]
            hits = len(set(p_techs).intersection(set(job_skills_lower)))
            if hits > 0 or not job_skills_lower:
                relevant.append(p.get("name", "Key Project"))
                total_hits += hits
        score = min(100, 60 + (total_hits * 15)) if projects else 50
        return relevant[:3], score

matching_engine = MatchingEngine()
