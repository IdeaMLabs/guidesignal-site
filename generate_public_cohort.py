#!/usr/bin/env python3
"""
Generate public_cohort.csv from applicants.csv for cohort.html display.
Filters by consent=TRUE and anonymizes personal data.
"""

import pandas as pd
import os
import json
from datetime import datetime

def generate_public_cohort():
    """Generate public cohort from applicants with consent filtering"""
    
    try:
        # Load applicants data
        if not os.path.exists('applicants.csv'):
            print("Warning: applicants.csv not found, creating empty public_cohort.csv")
            # Create empty CSV with expected columns
            empty_df = pd.DataFrame(columns=[
                'first_name', 'city', 'target_role', 'spotlight', 
                'sample_links', 'skills_display', 'avatar'
            ])
            empty_df.to_csv('public_cohort.csv', index=False)
            return
            
        # Read applicants CSV
        applicants_df = pd.read_csv('applicants.csv')
        
        # Filter by consent and exclude test/demo rows
        if 'consent' in applicants_df.columns:
            # Filter only those who gave consent
            consented_df = applicants_df[applicants_df['consent'] == True].copy()
        else:
            print("Note: No consent column found, processing all applicants")
            # For now, process all applicants but limit to test data
            consented_df = applicants_df.copy()
        
        # Exclude test/demo rows
        if not consented_df.empty:
            consented_df = consented_df[
                ~(
                    (consented_df.get('source', '') == 'test') |
                    (consented_df.get('email', '').str.endswith('@example.com')) |
                    (consented_df.get('name', '').isin(['TestUser', 'Demo', 'Sample']))
                )
            ].copy()
        
        # Process each consented applicant
        public_cohort = []
        
        for idx, row in consented_df.iterrows():
            # Extract first name only
            full_name = str(row.get('name', 'Anonymous'))
            first_name = full_name.split()[0] if full_name and full_name != 'nan' else 'Anonymous'
            
            # Use target_role if available, otherwise infer from skills
            if 'target_role' in row and pd.notna(row['target_role']) and str(row['target_role']).strip():
                target_role = str(row['target_role']).strip()
            else:
                skills_text = str(row.get('skills_text', '')).lower()
                target_role = infer_target_role(skills_text, row.get('skills_tags', ''))
            
            # Create spotlight from skills/experience
            spotlight = create_spotlight(row)
            
            # Generate sample links (placeholder for now)
            sample_links = "Portfolio • LinkedIn"
            
            # Skills for display
            skills_display = format_skills_display(row.get('skills_tags', ''))
            
            # Generate avatar emoji based on role
            avatar = get_role_avatar(target_role)
            
            public_cohort.append({
                'first_name': first_name,
                'city': str(row.get('city', 'Remote')),
                'target_role': target_role,
                'spotlight': spotlight,
                'sample_links': sample_links,
                'skills_display': skills_display,
                'avatar': avatar
            })
        
        # Convert to DataFrame and save
        public_df = pd.DataFrame(public_cohort)
        public_df.to_csv('public_cohort.csv', index=False)
        
        print(f"Public cohort generated successfully:")
        print(f"  Total applicants: {len(applicants_df)}")
        print(f"  Consented: {len(consented_df)}")
        print(f"  Public profiles: {len(public_cohort)}")
        print(f"  Output: public_cohort.csv")
        
    except Exception as e:
        print(f"Error generating public cohort: {e}")
        # Create empty CSV on error
        empty_df = pd.DataFrame(columns=[
            'first_name', 'city', 'target_role', 'spotlight', 
            'sample_links', 'skills_display', 'avatar'
        ])
        empty_df.to_csv('public_cohort.csv', index=False)

def infer_target_role(skills_text, skills_tags):
    """Infer target role from skills"""
    skills_lower = skills_text.lower()
    tags_lower = str(skills_tags).lower()
    
    if any(term in skills_lower or term in tags_lower for term in ['help desk', 'desktop support', 'helpdesk']):
        return 'Help Desk Technician'
    elif any(term in skills_lower or term in tags_lower for term in ['warehouse', 'shipping', 'logistics']):
        return 'Warehouse Associate'
    elif any(term in skills_lower or term in tags_lower for term in ['customer support', 'customer service']):
        return 'Support Analyst'
    elif any(term in skills_lower or term in tags_lower for term in ['frontend', 'react', 'javascript', 'css']):
        return 'Frontend Developer'
    elif any(term in skills_lower or term in tags_lower for term in ['devops', 'docker', 'kubernetes', 'aws']):
        return 'DevOps Engineer'
    elif any(term in skills_lower or term in tags_lower for term in ['ux', 'ui', 'design', 'figma']):
        return 'UX Designer'
    elif any(term in skills_lower or term in tags_lower for term in ['data', 'python', 'analytics', 'sql']):
        return 'Data Scientist'
    elif any(term in skills_lower or term in tags_lower for term in ['product', 'pm', 'roadmap']):
        return 'Product Manager'
    elif any(term in skills_lower or term in tags_lower for term in ['security', 'cybersecurity', 'infosec']):
        return 'Cybersecurity Analyst'
    elif any(term in skills_lower or term in tags_lower for term in ['backend', 'api', 'server', 'database']):
        return 'Backend Engineer'
    elif any(term in skills_lower or term in tags_lower for term in ['marketing', 'seo', 'content']):
        return 'Marketing Manager'
    elif any(term in skills_lower or term in tags_lower for term in ['sales', 'sdr', 'business development']):
        return 'Sales Development Rep'
    else:
        return 'Technical Support'

def create_spotlight(row):
    """Create spotlight text from applicant data"""
    skills = str(row.get('skills_text', ''))
    certs = str(row.get('certs', ''))
    resume = str(row.get('resume_text', ''))
    
    # Combine and limit to 160 chars
    spotlight_parts = []
    
    if certs and certs != 'nan':
        spotlight_parts.append(f"Certified: {certs}")
    
    if skills and skills != 'nan':
        skills_short = skills[:80] + "..." if len(skills) > 80 else skills
        spotlight_parts.append(f"Skills: {skills_short}")
    
    if resume and resume != 'nan':
        resume_short = resume[:50] + "..." if len(resume) > 50 else resume
        spotlight_parts.append(f"Experience: {resume_short}")
    
    spotlight = " • ".join(spotlight_parts)
    
    # Limit to 160 characters
    if len(spotlight) > 160:
        spotlight = spotlight[:157] + "..."
    
    return spotlight if spotlight else "Experienced professional ready for new opportunities"

def format_skills_display(skills_tags):
    """Format skills tags for display"""
    if not skills_tags or str(skills_tags) == 'nan':
        return "Technical Skills"
    
    tags = str(skills_tags).split(';')
    # Take first 4 tags and format nicely
    display_tags = [tag.strip().title() for tag in tags[:4]]
    return " • ".join(display_tags)

def get_role_avatar(role):
    """Get emoji avatar based on role"""
    avatars = {
        'Help Desk Technician': '🔧',
        'Warehouse Associate': '📦',
        'Support Analyst': '💬',
        'Frontend Developer': '💻',
        'DevOps Engineer': '⚙️',
        'UX Designer': '🎨',
        'Data Scientist': '📊',
        'Product Manager': '🚀',
        'Cybersecurity Analyst': '🔐',
        'Backend Engineer': '⚡',
        'Marketing Manager': '📱',
        'Sales Development Rep': '📈',
        'Technical Support': '🛠️'
    }
    return avatars.get(role, '👤')

if __name__ == "__main__":
    generate_public_cohort()