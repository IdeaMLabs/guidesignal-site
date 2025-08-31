#!/usr/bin/env python3
"""
Generate scoreboard.json from events.csv and jobs.csv for homepage display.

Metrics:
- 24h median reply time (hours)
- 24h reply percentage
- 7-day interview percentage  
- Certified job count from jobs.csv
"""

import pandas as pd
import json
from datetime import datetime, timedelta
import numpy as np
import os

def generate_scoreboard():
    """Generate scoreboard metrics and save to scoreboard.json"""
    
    # Initialize default metrics
    metrics = {
        "median_reply_hours_24h": 0,
        "reply_rate_24h": 0,
        "interview_rate_7d": 0,
        "certified_jobs": 0,
        "pledged_employers": 0,
        "slots_today": 5,  # Default remaining intro slots
        "next_review": "10:00 / 16:00 ET",  # Default review times
        "last24_apps": 0,
        "last24_replied": 0,
        "last_updated": datetime.now().isoformat()
    }
    
    try:
        # Load data files
        if not os.path.exists('events.csv'):
            print("Warning: events.csv not found, using default metrics")
            with open('scoreboard.json', 'w') as f:
                json.dump(metrics, f, indent=2)
            return
            
        if not os.path.exists('jobs.csv'):
            print("Warning: jobs.csv not found, using default metrics")
            with open('scoreboard.json', 'w') as f:
                json.dump(metrics, f, indent=2)
            return
            
        # Read CSV files
        events_df = pd.read_csv('events.csv')
        jobs_df = pd.read_csv('jobs.csv')
        
        # Filter out test data
        if 'source' in events_df.columns:
            events_df = events_df[events_df['source'] != 'test']
        
        # Convert timestamp columns to datetime
        if 'ts_applied' in events_df.columns:
            events_df['ts_applied'] = pd.to_datetime(events_df['ts_applied'])
        if 'ts_employer_reply' in events_df.columns:
            events_df['ts_employer_reply'] = pd.to_datetime(events_df['ts_employer_reply'], errors='coerce')
        
        # Calculate time windows
        now = datetime.now()
        time_24h = now - timedelta(hours=24)
        time_7d = now - timedelta(days=7)
        
        # Filter events for time windows
        events_24h = events_df[events_df['ts_applied'] >= time_24h] if 'ts_applied' in events_df.columns else pd.DataFrame()
        events_7d = events_df[events_df['ts_applied'] >= time_7d] if 'ts_applied' in events_df.columns else pd.DataFrame()
        
        # Calculate 24h median reply time
        if not events_24h.empty and 'ts_employer_reply' in events_24h.columns:
            replied_24h = events_24h.dropna(subset=['ts_employer_reply'])
            replied_24h = replied_24h[replied_24h['ts_employer_reply'] != '']
            if not replied_24h.empty:
                # Only calculate if we have valid timestamps for both applied and reply
                valid_replies = replied_24h[
                    (replied_24h['ts_employer_reply'].notna()) & 
                    (replied_24h['ts_applied'].notna()) &
                    (replied_24h['ts_employer_reply'] > replied_24h['ts_applied'])
                ]
                if not valid_replies.empty:
                    reply_times = (valid_replies['ts_employer_reply'] - valid_replies['ts_applied']).dt.total_seconds() / 3600
                    median_time = reply_times.median()
                    if pd.notna(median_time) and median_time >= 0:
                        metrics["median_reply_hours_24h"] = round(float(median_time), 1)
        
        # Calculate 24h reply percentage and counts
        if not events_24h.empty:
            total_applications_24h = len(events_24h)
            replies_24h = len(events_24h.dropna(subset=['ts_employer_reply']))
            metrics["last24_apps"] = int(total_applications_24h)
            metrics["last24_replied"] = int(replies_24h)
            if total_applications_24h > 0:
                metrics["reply_rate_24h"] = round((replies_24h / total_applications_24h) * 100, 1)
        
        # Calculate 7-day interview percentage
        if not events_7d.empty and 'interview' in events_7d.columns:
            total_applications_7d = len(events_7d)
            interviews_7d = events_7d['interview'].sum()
            if total_applications_7d > 0:
                metrics["interview_rate_7d"] = round((interviews_7d / total_applications_7d) * 100, 1)
        
        # Count certified jobs
        if 'fast_reply_certified' in jobs_df.columns:
            certified_jobs = jobs_df['fast_reply_certified'].sum()
            metrics["certified_jobs"] = int(certified_jobs)
        
        # Count pledged employers from public_jobs.csv
        if os.path.exists('public_jobs.csv'):
            try:
                public_jobs_df = pd.read_csv('public_jobs.csv')
                if 'pledged_48h' in public_jobs_df.columns:
                    pledged_count = public_jobs_df['pledged_48h'].sum()
                    metrics["pledged_employers"] = int(pledged_count)
            except Exception as e:
                print(f"Warning: Could not read public_jobs.csv for pledged employers count: {e}")
                metrics["pledged_employers"] = 0
        
        # Calculate intro capacity and review times
        current_hour = datetime.now().hour
        
        # Calculate remaining slots (assume max 3 intros per day, reduce throughout day)
        if current_hour < 10:
            slots_remaining = 3  # Morning: full capacity
        elif current_hour < 14:
            slots_remaining = 2  # Midday: reduced capacity  
        elif current_hour < 17:
            slots_remaining = 1  # Afternoon: limited capacity
        else:
            slots_remaining = 0  # Evening: no capacity
        
        metrics["slots_today"] = slots_remaining
        
        # Set next review times based on Eastern Time business hours
        if current_hour < 10:
            metrics["next_review"] = "10:00 / 16:00 ET"
        elif current_hour < 16:
            metrics["next_review"] = "16:00 ET / Tomorrow 10:00 ET"
        else:
            metrics["next_review"] = "Tomorrow 10:00 / 16:00 ET"
        
        # Write scoreboard.json
        with open('scoreboard.json', 'w') as f:
            json.dump(metrics, f, indent=2)
            
        print(f"Scoreboard generated successfully:")
        print(f"  24h apps: {metrics['last24_apps']}")
        print(f"  24h replied: {metrics['last24_replied']}")
        print(f"  24h median reply: {metrics['median_reply_hours_24h']} hours")
        print(f"  24h reply rate: {metrics['reply_rate_24h']}%")
        print(f"  7d interview rate: {metrics['interview_rate_7d']}%")
        print(f"  Certified jobs: {metrics['certified_jobs']}")
        print(f"  Pledged employers: {metrics['pledged_employers']}")
        print(f"  Slots today: {metrics['slots_today']}")
        print(f"  Next review: {metrics['next_review']}")
        
    except Exception as e:
        print(f"Error generating scoreboard: {e}")
        # Write default metrics on error
        with open('scoreboard.json', 'w') as f:
            json.dump(metrics, f, indent=2)

if __name__ == "__main__":
    generate_scoreboard()