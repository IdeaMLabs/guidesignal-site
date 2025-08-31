#!/usr/bin/env python3
"""
Generate public_jobs.csv from jobs.csv for the jobs.html page.
Filters and transforms job data for public display.
"""

import pandas as pd
import os
import sys
from datetime import datetime

def make_public_jobs(input_file='jobs.csv', output_file='public_jobs.csv'):
    """Convert jobs.csv to public_jobs.csv with appropriate columns for display"""
    
    try:
        if not os.path.exists(input_file):
            print(f"Warning: {input_file} not found, creating empty public jobs file")
            # Create empty public jobs CSV with expected columns
            empty_df = pd.DataFrame(columns=[
                'employer', 'job_title', 'job_city', 'job_pay_min', 'job_pay_max',
                'musts', 'nice', 'fast_reply_certified', 'featured', 'job_status', 'pledged_48h'
            ])
            empty_df.to_csv(output_file, index=False)
            print(f"Created empty {output_file}")
            return True
        
        # Read jobs data
        jobs_df = pd.read_csv(input_file)
        
        if len(jobs_df) == 0:
            print(f"Warning: {input_file} is empty, creating empty public jobs file")
            empty_df = pd.DataFrame(columns=[
                'employer', 'job_title', 'job_city', 'job_pay_min', 'job_pay_max',
                'musts', 'nice', 'fast_reply_certified', 'featured', 'job_status', 'pledged_48h'
            ])
            empty_df.to_csv(output_file, index=False)
            print(f"Created empty {output_file}")
            return True
        
        # Transform to public format
        public_jobs = []
        
        for _, row in jobs_df.iterrows():
            # Map internal columns to public display columns
            public_job = {
                'employer': row.get('employer_name', ''),
                'job_title': row.get('title', ''),
                'job_city': row.get('city', ''),
                'job_pay_min': row.get('pay_min', 0),
                'job_pay_max': row.get('pay_max', 0),
                'musts': row.get('must_have_skills', '').replace(';', ', ') if pd.notna(row.get('must_have_skills', '')) else '',
                'nice': row.get('nice_to_have', '').replace(';', ', ') if pd.notna(row.get('nice_to_have', '')) else '',
                'fast_reply_certified': bool(row.get('fast_reply_certified', False)),
                'featured': False,  # TODO: Add featured logic if needed
                'job_status': 'active',  # TODO: Add status logic if needed
                'pledged_48h': bool(row.get('reply_pledge_48h', False))  # Copy from reply_pledge_48h
            }
            
            public_jobs.append(public_job)
        
        # Create public jobs dataframe
        public_df = pd.DataFrame(public_jobs)
        
        # Save to output file
        public_df.to_csv(output_file, index=False)
        
        print(f"Generated {output_file} with {len(public_df)} job listings")
        pledged_count = sum(public_df['pledged_48h'])
        print(f"Jobs with 48h pledge: {pledged_count}")
        
        return True
        
    except Exception as e:
        print(f"Error generating public jobs: {e}")
        return False

if __name__ == '__main__':
    success = make_public_jobs()
    sys.exit(0 if success else 1)