#!/usr/bin/env python3
"""
Enhance outreach emails with event tracking and outcome update links.
Processes outreach_emails.csv to add event_id and outcome footer links.
"""

import pandas as pd
import os
import sys
from datetime import datetime
import uuid

def generate_event_id():
    """Generate unique event ID"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_suffix = str(uuid.uuid4())[:8]
    return f"E{timestamp}_{random_suffix}"

def add_outcome_footer(body_text, event_id, applicant_name="", job_title="", company_name=""):
    """Add outcome update footer to email body"""
    
    # URL encode parameters for safety
    import urllib.parse
    params = {
        'e': event_id,
        'candidate': applicant_name,
        'position': job_title,
        'company': company_name
    }
    
    param_string = '&'.join([f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items() if v])
    outcome_url = f"https://ideamlabs.github.io/guidesignal-site/outcome.html?{param_string}"
    
    footer = f"""
---
📊 Update outcome: {outcome_url}
Help us track placement success and improve our matching!
"""
    
    return body_text.strip() + footer

def enhance_outreach_emails(input_file='outreach_emails.csv', output_file=None):
    """Enhance outreach emails with event tracking"""
    
    if output_file is None:
        output_file = input_file
    
    try:
        # Read outreach emails
        if not os.path.exists(input_file):
            print(f"Error: {input_file} not found")
            return False
            
        df = pd.read_csv(input_file)
        
        # Add event_id column if it doesn't exist
        if 'event_id' not in df.columns:
            df['event_id'] = ''
        
        # Process each email
        for idx, row in df.iterrows():
            # Generate event_id if missing
            if pd.isna(row['event_id']) or row['event_id'] == '':
                event_id = generate_event_id()
                df.at[idx, 'event_id'] = event_id
            else:
                event_id = row['event_id']
            
            # Extract info from body for better outcome links
            body = str(row.get('body', ''))
            subject = str(row.get('subject', ''))
            
            # Try to extract applicant name from body (look for **Name** pattern)
            applicant_name = ""
            if '**' in body:
                parts = body.split('**')
                if len(parts) >= 3:
                    applicant_name = parts[1].strip()
            
            # Try to extract job title and company from subject
            job_title = ""
            company_name = ""
            if 'opportunity for' in subject and 'at' in subject:
                try:
                    # Pattern: [Fast-Reply] Job Title opportunity for Name at Company
                    parts = subject.split('opportunity for')[0]
                    if ']' in parts:
                        job_title = parts.split(']')[1].strip()
                    
                    if 'at' in subject:
                        company_parts = subject.split('at')
                        if len(company_parts) > 1:
                            company_name = company_parts[-1].strip()
                except:
                    pass  # If parsing fails, leave empty
            
            # Add outcome footer to body
            enhanced_body = add_outcome_footer(
                body, 
                event_id, 
                applicant_name, 
                job_title, 
                company_name
            )
            
            df.at[idx, 'body'] = enhanced_body
        
        # Save enhanced emails
        df.to_csv(output_file, index=False)
        
        print(f"Enhanced {len(df)} outreach emails with event tracking")
        print(f"Added event_id and outcome update links")
        return True
        
    except Exception as e:
        print(f"Error enhancing outreach emails: {e}")
        return False

def update_events_csv_with_ids():
    """Update events.csv to include event_id column and generate IDs for existing records"""
    
    events_file = 'events.csv'
    if not os.path.exists(events_file):
        print(f"Warning: {events_file} not found")
        return False
    
    try:
        df = pd.read_csv(events_file)
        
        # Add event_id column if it doesn't exist
        if 'event_id' not in df.columns:
            df['event_id'] = ''
        
        # Generate event_ids for rows that don't have them
        for idx, row in df.iterrows():
            if pd.isna(row['event_id']) or row['event_id'] == '':
                df.at[idx, 'event_id'] = generate_event_id()
        
        # Save updated events.csv
        df.to_csv(events_file, index=False)
        
        print(f"Updated events.csv with event_id for {len(df)} records")
        return True
        
    except Exception as e:
        print(f"Error updating events.csv: {e}")
        return False

def main():
    """Main function to enhance outreach system"""
    print("Enhancing outreach system with event tracking...")
    
    # Update events.csv first
    update_events_csv_with_ids()
    
    # Enhance outreach emails
    enhance_outreach_emails()
    
    print("Outreach enhancement completed!")
    return True

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Fatal error in outreach enhancement: {e}")
        sys.exit(1)