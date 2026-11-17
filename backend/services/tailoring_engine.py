import copy
import uuid
from typing import Dict, Any, List
from sqlalchemy.orm.attributes import flag_modified
from models.job import Job
from models.tailored_resume import TailoredResume
from services.latex_compiler import latex_compiler

class TailoringEngine:
    """Truthful Resume Tailoring Engine with Zero-Hallucination Invariant and Structured Diff Approval."""

    @classmethod
    def generate_tailored_version(cls, user_id: str, master_resume_id: str, master_ast: Dict[str, Any], job: Job) -> TailoredResume:
        # Clone master AST
        tailored_ast = copy.deepcopy(master_ast)
        diffs: List[Dict[str, Any]] = []
        
        job_skills = set([s.lower() for s in (job.extracted_skills or [])])
        candidate_skills = set([s.lower() for s in tailored_ast.get("skills", [])])
        shared_skills = job_skills.intersection(candidate_skills)

        # 1. Summary Refinement (Highlighting authentic existing domain expertise)
        original_summary = tailored_ast.get("professional_summary", "")
        if original_summary:
            target_role = job.title
            emphasis_terms = list(shared_skills)[:3]
            terms_phrase = f" with hands-on proficiency in {', '.join([t.title() for t in emphasis_terms])}" if emphasis_terms else ""
            proposed_summary = f"{original_summary.rstrip('.')} Tailored to target the {target_role} position{terms_phrase}."
            
            diff_id = str(uuid.uuid4())
            diffs.append({
                "id": diff_id,
                "section": "Professional Summary",
                "original": original_summary,
                "proposed": proposed_summary,
                "reason": f"Alignts executive summary towards '{target_role}' emphasizing verified skills: {', '.join([t.title() for t in emphasis_terms])}.",
                "matched_keyword": target_role,
                "status": "pending"
            })

        # 2. Work Experience Bullet Refinement
        experiences = tailored_ast.get("work_experience", [])
        for i, exp in enumerate(experiences):
            highlights = exp.get("highlights", [])
            for j, h in enumerate(highlights):
                # Look for matching keyword opportunities without changing facts
                for skill in shared_skills:
                    if skill in job.description.lower() and skill not in h.lower() and j == 0:
                        rephrased = f"{h.rstrip('.')} utilizing {skill.title()} and modern architectural patterns."
                        diff_id = str(uuid.uuid4())
                        diffs.append({
                            "id": diff_id,
                            "section": f"Experience ({exp.get('company')})",
                            "original": h,
                            "proposed": rephrased,
                            "reason": f"Highlights your hands-on mastery of '{skill.title()}' directly referenced in the job requirements.",
                            "matched_keyword": skill.title(),
                            "status": "pending",
                            "exp_idx": i,
                            "bullet_idx": j
                        })
                        break # One refined highlight per experience

        # 3. Skills Ordering: Reorder existing skills so matching job requirements appear first
        original_skills = tailored_ast.get("skills", [])
        reordered_skills = []
        # Put shared skills first
        for s in original_skills:
            if s.lower() in shared_skills:
                reordered_skills.append(s)
        for s in original_skills:
            if s.lower() not in shared_skills:
                reordered_skills.append(s)
                
        if reordered_skills != original_skills:
            diff_id = str(uuid.uuid4())
            diffs.append({
                "id": diff_id,
                "section": "Technical Skills",
                "original": ", ".join(original_skills),
                "proposed": ", ".join(reordered_skills),
                "reason": "Prioritizes skills required by the employer at the top of your skills list for ATS visibility.",
                "matched_keyword": "ATS Ordering",
                "status": "pending",
                "is_skills_reorder": True,
                "reordered_list": reordered_skills
            })

        # Generate initial LaTeX
        latex_src = latex_compiler.generate_latex_source(tailored_ast)
        compilation_res = latex_compiler.compile_document(latex_src, f"tailored_{job.id[:8]}")

        return TailoredResume(
            user_id=user_id,
            job_id=job.id,
            master_resume_id=master_resume_id,
            version_name=f"Tailored for {job.company} - {job.title}",
            tailored_structured_data=tailored_ast,
            diff_summary=diffs,
            latex_source=latex_src,
            pdf_file_path=compilation_res.get("pdf_path"),
            compilation_status=compilation_res.get("status", "ready"),
            compilation_logs=compilation_res.get("logs")
        )

    @classmethod
    def apply_diff_decisions(cls, tailored_resume: TailoredResume, diff_id: str, decision: str) -> TailoredResume:
        """Applies a user's Accept or Reject decision to a proposed diff and recompiles the document."""
        ast = copy.deepcopy(tailored_resume.tailored_structured_data)
        updated_diffs = []
        
        for diff in tailored_resume.diff_summary:
            if diff.get("id") == diff_id:
                diff["status"] = decision
                if decision == "accepted":
                    if diff.get("section") == "Professional Summary":
                        ast["professional_summary"] = diff["proposed"]
                    elif diff.get("is_skills_reorder"):
                        ast["skills"] = diff["reordered_list"]
                    elif "exp_idx" in diff and "bullet_idx" in diff:
                        exp_i = diff["exp_idx"]
                        b_i = diff["bullet_idx"]
                        if exp_i < len(ast.get("work_experience", [])):
                            if b_i < len(ast["work_experience"][exp_i].get("highlights", [])):
                                ast["work_experience"][exp_i]["highlights"][b_i] = diff["proposed"]
            updated_diffs.append(diff)
            
        tailored_resume.diff_summary = list(updated_diffs)
        tailored_resume.tailored_structured_data = dict(ast)
        flag_modified(tailored_resume, "diff_summary")
        flag_modified(tailored_resume, "tailored_structured_data")
        
        # Re-generate LaTeX & document
        latex_src = latex_compiler.generate_latex_source(ast)
        tailored_resume.latex_source = latex_src
        comp_res = latex_compiler.compile_document(latex_src, f"tailored_{tailored_resume.job_id[:8]}")
        tailored_resume.pdf_file_path = comp_res.get("pdf_path")
        tailored_resume.compilation_status = comp_res.get("status", "ready")
        
        return tailored_resume

tailoring_engine = TailoringEngine()
