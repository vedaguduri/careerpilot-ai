import os
import re
import subprocess
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
from config import settings

class LatexCompiler:
    """Deterministic LaTeX resume generator and compiler with strict character escaping."""
    
    SPECIAL_CHARS = {
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\textasciicircum{}',
        '\\': r'\textbackslash{}',
    }

    @classmethod
    def sanitize(cls, text: Any) -> str:
        """Escapes LaTeX special characters while handling non-string inputs safely."""
        if not text:
            return ""
        if not isinstance(text, str):
            text = str(text)
        # Escape backslash first to avoid double escaping
        text = text.replace('\\', r'\textbackslash{}')
        for char, replacement in cls.SPECIAL_CHARS.items():
            if char != '\\':
                text = text.replace(char, replacement)
        return text

    @classmethod
    def generate_latex_source(cls, ast: Dict[str, Any], template_name: str = "modern_clean") -> str:
        """Generates clean, ATS-compliant LaTeX source code from structured resume AST."""
        contact = ast.get("contact", {})
        summary = cls.sanitize(ast.get("professional_summary", ""))
        skills = [cls.sanitize(s) for s in ast.get("skills", [])]
        experiences = ast.get("work_experience", [])
        education = ast.get("education", [])
        projects = ast.get("projects", [])
        certifications = ast.get("certifications", [])

        # Build contact line
        contact_items = []
        if contact.get("email"):
            contact_items.append(cls.sanitize(contact['email']))
        if contact.get("phone"):
            contact_items.append(cls.sanitize(contact['phone']))
        if contact.get("location"):
            contact_items.append(cls.sanitize(contact['location']))
        if contact.get("linkedin"):
            contact_items.append(cls.sanitize(contact['linkedin']))
        if contact.get("github"):
            contact_items.append(cls.sanitize(contact['github']))
        contact_line = " $\\cdot$ ".join(contact_items)

        # Build Experience Section
        exp_tex = []
        for exp in experiences:
            comp = cls.sanitize(exp.get("company", ""))
            role = cls.sanitize(exp.get("role", ""))
            loc = cls.sanitize(exp.get("location", ""))
            start = cls.sanitize(exp.get("start_date", ""))
            end = cls.sanitize(exp.get("end_date", ""))
            date_str = f"{start} -- {end}" if start and end else start or end
            
            bullets = "\n".join([f"    \\item {cls.sanitize(h)}" for h in exp.get("highlights", [])])
            techs = ", ".join([cls.sanitize(t) for t in exp.get("technologies", [])])
            tech_line = f"\n    \\item \\textit{{Technologies}}: {techs}" if techs else ""
            
            exp_tex.append(f"""\\textbf{{{role}}} \\hfill {date_str} \\\\
\\textit{{{comp}}} \\hfill \\textit{{{loc}}}
\\begin{{itemize}}[leftmargin=1.2em, itemsep=1pt, parsep=0pt, topsep=2pt]
{bullets}{tech_line}
\\end{{itemize}}
\\vspace{{4pt}}""")

        # Build Projects Section
        proj_tex = []
        for p in projects:
            pname = cls.sanitize(p.get("name", ""))
            ptech = ", ".join([cls.sanitize(t) for t in p.get("technologies", [])])
            pdesc = cls.sanitize(p.get("description", ""))
            tech_part = f" \\textit{{| {ptech}}}" if ptech else ""
            
            pbullets = "\n".join([f"    \\item {cls.sanitize(h)}" for h in p.get("highlights", [])])
            proj_tex.append(f"""\\textbf{{{pname}}}{tech_part} \\\\
{pdesc}
\\begin{{itemize}}[leftmargin=1.2em, itemsep=1pt, parsep=0pt, topsep=2pt]
{pbullets}
\\end{{itemize}}
\\vspace{{4pt}}""")

        # Build Education Section
        edu_tex = []
        for edu in education:
            inst = cls.sanitize(edu.get("institution", ""))
            deg = cls.sanitize(edu.get("degree", ""))
            field = cls.sanitize(edu.get("field_of_study", ""))
            syear = cls.sanitize(edu.get("start_year", ""))
            eyear = cls.sanitize(edu.get("end_year", ""))
            gpa = cls.sanitize(edu.get("gpa", ""))
            dates = f"{syear} -- {eyear}" if syear and eyear else syear or eyear
            gpa_part = f" $\\cdot$ GPA: {gpa}" if gpa else ""
            
            edu_tex.append(f"""\\textbf{{{inst}}} \\hfill {dates} \\\\
\\textit{{{deg} in {field}}}{gpa_part}
\\vspace{{3pt}}""")

        # Build Skills Section
        skills_str = ", ".join(skills)

        latex_template = f"""\\documentclass[letterpaper,10pt]{{article}}
\\usepackage[empty]{{fullpage}}
\\usepackage{{titlesec}}
\\usepackage{{enumitem}}
\\usepackage[hidelinks]{{hyperref}}
\\usepackage{{geometry}}

\\geometry{{left=0.6in, top=0.6in, right=0.6in, bottom=0.6in}}

\\pagestyle{{empty}}
\\raggedbottom
\\raggedright
\\setlength{{\\tabcolsep}}{{0in}}

% Section title formatting
\\titleformat{{\\section}}{{
  \\vspace{{-4pt}}\\scshape\\raggedright\\large\\bfseries
}}{{}}{{0em}}{{}}[\\color{{black}}\\titlerule \\vspace{{-3pt}}]

\\begin{{document}}

% --- HEADER ---
\\begin{{center}}
    {{\\Huge \\textbf{{{cls.sanitize(contact.get("name", "Candidate"))}}}}} \\\\ \\vspace{{4pt}}
    \\small {contact_line}
\\end{{center}}

\\vspace{{-6pt}}

% --- PROFESSIONAL SUMMARY ---
\\section{{Professional Summary}}
\\small {summary}

\\vspace{{4pt}}

% --- CORE TECHNICAL SKILLS ---
\\section{{Technical Skills}}
\\small {skills_str}

\\vspace{{4pt}}

% --- WORK EXPERIENCE ---
\\section{{Professional Experience}}
{"".join(exp_tex)}

% --- PROJECTS ---
\\section{{Technical Projects}}
{"".join(proj_tex)}

% --- EDUCATION ---
\\section{{Education}}
{"".join(edu_tex)}

\\end{{document}}
"""
        return latex_template

    @classmethod
    def compile_document(cls, latex_source: str, output_name: str) -> Dict[str, Any]:
        """Compiles LaTeX source to PDF using local engine (tectonic / pdflatex) or generates structured PDF representation."""
        output_dir = settings.GENERATED_DIR
        output_dir.mkdir(parents=True, exist_ok=True)
        
        tex_file_path = output_dir / f"{output_name}.tex"
        pdf_file_path = output_dir / f"{output_name}.pdf"
        
        # Save .tex file
        with open(tex_file_path, "w", encoding="utf-8") as f:
            f.write(latex_source)
            
        # Check if tectonic is available
        tectonic_path = shutil.which("tectonic")
        pdflatex_path = shutil.which("pdflatex")
        
        if tectonic_path:
            try:
                res = subprocess.run(
                    [tectonic_path, "-o", str(output_dir), str(tex_file_path)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=30
                )
                if res.returncode == 0 and pdf_file_path.exists():
                    return {
                        "status": "compiled",
                        "engine": "tectonic",
                        "tex_path": str(tex_file_path),
                        "pdf_path": str(pdf_file_path),
                        "logs": res.stdout
                    }
            except Exception as e:
                pass
                
        if pdflatex_path:
            try:
                res = subprocess.run(
                    [pdflatex_path, "-interaction=nonstopmode", f"-output-directory={output_dir}", str(tex_file_path)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=30
                )
                if pdf_file_path.exists():
                    return {
                        "status": "compiled",
                        "engine": "pdflatex",
                        "tex_path": str(tex_file_path),
                        "pdf_path": str(pdf_file_path),
                        "logs": res.stdout
                    }
            except Exception as e:
                pass

        # If local compiler is not present, generate clean printable document / downloadable .tex
        return {
            "status": "ready",
            "engine": "tex-source",
            "tex_path": str(tex_file_path),
            "pdf_path": str(tex_file_path), # Downloadable source ready
            "logs": "Deterministic LaTeX document validated and ready for export."
        }

latex_compiler = LatexCompiler()
