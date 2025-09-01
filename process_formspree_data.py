#!/usr/bin/env python3
"""
Process form submissions from Formspree and update applicants.csv and events.csv.
Handles role and role_custom fields to set target_role.
Processes outcome form submissions to update interview/hire status.
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
    """Process applicants data to add target_role field and UTM fields"""
    
    if output_file is None:
        output_file = input_file
    
    try:
        # Read the CSV file
        df = pd.read_csv(input_file)
        
        # Add target_role column if it doesn't exist
        if 'target_role' not in df.columns:
            df['target_role'] = ''
        
        # Add UTM columns if they don't exist
        if 'utm_source' not in df.columns:
            df['utm_source'] = ''
        if 'utm_medium' not in df.columns:
            df['utm_medium'] = ''
        if 'utm_campaign' not in df.columns:
            df['utm_campaign'] = ''
        if 'created_at' not in df.columns:
            df['created_at'] = ''
        
        # Process each row
        for idx, row in df.iterrows():
            # Get target_role from role/role_custom fields (returns role_custom or role or "")
            target_role = process_role_fields(row)
            
            # Update the target_role field
            df.at[idx, 'target_role'] = target_role
            
            # Add created_at if missing (for existing records)
            if pd.isna(df.at[idx, 'created_at']) or df.at[idx, 'created_at'] == '':
                df.at[idx, 'created_at'] = datetime.now().isoformat()
        
        # Save the updated data
        df.to_csv(output_file, index=False)
        
        print(f"Processed {len(df)} applicant records")
        print(f"Updated target_role field based on role/role_custom preferences")
        print(f"Added UTM tracking fields for conversion analysis")
        
        return True
        
    except Exception as e:
        print(f"Error processing applicants data: {e}")
        return False

def process_job_form_submission(form_data):
    """Process a job form submission and return a job row"""
    # Extract pledge information using the specified logic
    pledge = (form_data.get('reply_pledge_48h','').strip().lower() in {'true','on','1','yes'})
    
    # Check work email validation
    needs_verification = (form_data.get('needs_verification', 'false').strip().lower() == 'true')
    work_email_ok = not needs_verification
    
    # Determine priority: HIGH only if work_email_ok is True
    priority = 'HIGH' if work_email_ok else 'NORMAL'
    
    row = {
        'id': f"J{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}",  # Generate unique ID
        'employer_name': form_data.get('company', ''),
        'title': form_data.get('job_title', ''),
        'city': form_data.get('job_city', ''),
        'pay_min': form_data.get('job_pay_min', 0),
        'pay_max': form_data.get('job_pay_max', 0),
        'must_have_skills': form_data.get('musts', '').replace(',', ';'),
        'nice_to_have': form_data.get('nice', '').replace(',', ';'),
        'description': '',  # Can be derived from other fields if needed
        'response_fast_prob': 0.8,  # Default fast response probability
        'response_median_reply_hours': 2.0,  # Default median reply time
        'active_apps_last_24h': 0,
        'capacity_per_day': 5,
        'fast_reply_certified': False,  # Will be updated based on actual performance
        'contact_email': form_data.get('contact_email', ''),
        'contact_name': form_data.get('contact_name', ''),
        'reply_pledge_48h': pledge,
        'work_email_ok': work_email_ok,
        'priority': priority,
        'needs_verification': needs_verification,
        'utm_source': form_data.get('utm_source', ''),
        'utm_medium': form_data.get('utm_medium', ''),
        'utm_campaign': form_data.get('utm_campaign', ''),
        'created_at': datetime.now().isoformat()
    }
    
    return row

def process_jobs_data(input_file='jobs.csv', output_file=None):
    """Process jobs data to add reply_pledge_48h field"""
    
    if output_file is None:
        output_file = input_file
    
    try:
        # Read the CSV file, create if it doesn't exist
        if os.path.exists(input_file):
            df = pd.read_csv(input_file)
        else:
            # Create empty jobs dataframe with expected columns
            df = pd.DataFrame(columns=[
                'id', 'employer_name', 'title', 'city', 'pay_min', 'pay_max', 
                'must_have_skills', 'nice_to_have', 'description', 
                'response_fast_prob', 'response_median_reply_hours', 
                'active_apps_last_24h', 'capacity_per_day', 'reply_pledge_48h'
            ])
        
        # Add reply_pledge_48h column if it doesn't exist
        if 'reply_pledge_48h' not in df.columns:
            df['reply_pledge_48h'] = False
        
        # Add UTM columns if they don't exist
        if 'utm_source' not in df.columns:
            df['utm_source'] = ''
        if 'utm_medium' not in df.columns:
            df['utm_medium'] = ''
        if 'utm_campaign' not in df.columns:
            df['utm_campaign'] = ''
        if 'created_at' not in df.columns:
            df['created_at'] = ''
        
        # Process each row to ensure reply_pledge_48h is boolean using the same logic as form processing
        for idx, row in df.iterrows():
            pledge_value = str(row.get('reply_pledge_48h', '')).strip().lower()
            
            # Use the same logic as form processing: {'true','on','1','yes'}
            pledge_bool = pledge_value in {'true', 'on', '1', 'yes'}
            
            df.at[idx, 'reply_pledge_48h'] = pledge_bool
            
            # Add created_at if missing (for existing records)
            if pd.isna(df.at[idx, 'created_at']) or df.at[idx, 'created_at'] == '':
                df.at[idx, 'created_at'] = datetime.now().isoformat()
        
        # Save the updated data
        df.to_csv(output_file, index=False)
        
        print(f"Processed {len(df)} job records")
        print(f"Updated reply_pledge_48h field for job listings")
        
        return True
        
    except Exception as e:
        print(f"Error processing jobs data: {e}")
        return False

def process_outcome_form_submission(form_data):
    """Process an outcome form submission and update events.csv"""
    try:
        event_id = form_data.get('event_id', '').strip()
        if not event_id:
            print("Error: No event_id provided in outcome form")
            return False
        
        # Load events.csv
        events_file = 'events.csv'
        if not os.path.exists(events_file):
            print(f"Error: {events_file} not found")
            return False
            
        df = pd.read_csv(events_file)
        
        # Find the row with matching event_id
        if 'event_id' not in df.columns:
            print("Error: event_id column not found in events.csv")
            return False
            
        matching_rows = df[df['event_id'] == event_id]
        if len(matching_rows) == 0:
            print(f"Warning: No event found with ID {event_id}")
            return False
            
        if len(matching_rows) > 1:
            print(f"Warning: Multiple events found with ID {event_id}, updating first match")
        
        # Get the index of the first matching row
        idx = matching_rows.index[0]
        
        # Extract outcome data
        outcome = form_data.get('outcome', '').strip()
        when = form_data.get('when', '').strip()
        notes = form_data.get('notes', '').strip()
        
        # Add columns if they don't exist
        if 'interview' not in df.columns:
            df['interview'] = 0
        if 'hired' not in df.columns:
            df['hired'] = 0
        if 'outcome_when' not in df.columns:
            df['outcome_when'] = ''
        if 'outcome_notes' not in df.columns:
            df['outcome_notes'] = ''
        if 'outcome_updated' not in df.columns:
            df['outcome_updated'] = ''
        
        # Update the event based on outcome
        if outcome == 'interviewed':
            df.at[idx, 'interview'] = 1
            df.at[idx, 'hired'] = 0  # Reset hired if previously set
        elif outcome == 'hired':
            df.at[idx, 'interview'] = 1  # Hired implies interviewed
            df.at[idx, 'hired'] = 1
        elif outcome == 'not_a_fit':
            df.at[idx, 'interview'] = 0
            df.at[idx, 'hired'] = 0
        
        # Update additional fields
        df.at[idx, 'outcome_when'] = when
        df.at[idx, 'outcome_notes'] = notes
        df.at[idx, 'outcome_updated'] = datetime.now().isoformat()
        
        # Save updated events.csv
        df.to_csv(events_file, index=False)
        
        print(f"Updated event {event_id}: outcome={outcome}")
        return True
        
    except Exception as e:
        print(f"Error processing outcome form: {e}")
        return False

def process_formspree_data(form_data):
    """Main function to process different types of Formspree submissions"""
    form_type = form_data.get('form_type', '').strip()
    
    if form_type == 'outcome':
        return process_outcome_form_submission(form_data)
    elif form_type == 'job':
        # Handle job posting forms (if needed in the future)
        print("Job form processing not implemented in this function")
        return False
    else:
        # Default: treat as applicant form (backward compatibility)
        print("Processing as applicant form (no form_type specified)")
        return True

if __name__ == '__main__':
    # Process both applicants and jobs data
    success_applicants = process_applicants_data()
    success_jobs = process_jobs_data()
    
    success = success_applicants and success_jobs
    sys.exit(0 if success else 1)