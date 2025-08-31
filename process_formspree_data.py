#!/usr/bin/env python3
"""
Process form submissions from Formspree and update applicants.csv.
Handles role and role_custom fields to set target_role.
"""

import pandas as pd
import os
import sys
from datetime import datetime

def process_role_fields(row):
    """Process role and role_custom fields to determine target_role"""
    role = str(row.get('role', '')).strip()
    role_custom = str(row.get('role_custom', '')).strip()
    
    # Priority order: role_custom > role > empty string
    if role_custom and role_custom != 'nan' and role_custom != '':
        return role_custom
    elif role and role != 'nan' and role != '' and role != 'Other':
        return role
    else:
        return ""

def infer_target_role_from_skills(skills_text, skills_tags):
    """Fallback: infer target role from skills if not specified"""
    skills_lower = str(skills_text).lower()
    tags_lower = str(skills_tags).lower()
    
    if any(term in skills_lower or term in tags_lower for term in ['help desk', 'desktop support', 'helpdesk']):
        return 'Help Desk / Desktop Support'
    elif any(term in skills_lower or term in tags_lower for term in ['warehouse', 'shipping', 'logistics']):
        return 'Warehouse Associate'
    elif any(term in skills_lower or term in tags_lower for term in ['customer support', 'customer service']):
        return 'Customer Support'
    elif any(term in skills_lower or term in tags_lower for term in ['operations', 'dispatch', 'coordinator']):
        return 'Operations / Dispatcher'
    else:
        return 'General'

def process_applicants_data(input_file='applicants.csv', output_file=None):
    """Process applicants data to add target_role field"""
    
    if output_file is None:
        output_file = input_file
    
    try:
        # Read the CSV file
        df = pd.read_csv(input_file)
        
        # Add target_role column if it doesn't exist
        if 'target_role' not in df.columns:
            df['target_role'] = ''
        
        # Process each row
        for idx, row in df.iterrows():
            # Get target_role from role/role_custom fields (returns role_custom or role or "")
            target_role = process_role_fields(row)
            
            # Update the target_role field
            df.at[idx, 'target_role'] = target_role
        
        # Save the updated data
        df.to_csv(output_file, index=False)
        
        print(f"Processed {len(df)} applicant records")
        print(f"Updated target_role field based on role/role_custom preferences")
        
        return True
        
    except Exception as e:
        print(f"Error processing applicants data: {e}")
        return False

if __name__ == '__main__':
    success = process_applicants_data()
    sys.exit(0 if success else 1)