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
        "open_tickets": 0,
        "acks_pending": 0,
        "oldest_ticket_hours": 0.0,
        "intro_interview_rate": 0.0,
        "intro_hire_rate": 0.0,
        "training_events": 0,
        "last_trained": None,
        "ml_weights": {},
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
        
        # Count open tickets from triage.csv
        if os.path.exists('triage.csv'):
            try:
                triage_df = pd.read_csv('triage.csv')
                if 'status' in triage_df.columns:
                    open_tickets = len(triage_df[triage_df['status'] == 'OPEN'])
                    metrics["open_tickets"] = int(open_tickets)
                else:
                    metrics["open_tickets"] = 0
            except Exception as e:
                print(f"Warning: Could not read triage.csv for open tickets count: {e}")
                metrics["open_tickets"] = 0
        else:
            metrics["open_tickets"] = 0
        
        # Count pending acknowledgments from triage.csv
        if os.path.exists('triage.csv'):
            try:
                triage_df = pd.read_csv('triage.csv')
                if 'ack_sent' in triage_df.columns:
                    pending_acks = len(triage_df[triage_df['ack_sent'].isna() | (triage_df['ack_sent'] == '')])
                    metrics["acks_pending"] = int(pending_acks)
                else:
                    # If ack_sent column doesn't exist, all open tickets are pending acks
                    if 'status' in triage_df.columns:
                        pending_acks = len(triage_df[triage_df['status'] == 'OPEN'])
                        metrics["acks_pending"] = int(pending_acks)
                    else:
                        metrics["acks_pending"] = 0
            except Exception as e:
                print(f"Warning: Could not read triage.csv for pending acks count: {e}")
                metrics["acks_pending"] = 0
        else:
            metrics["acks_pending"] = 0
        
        # Calculate oldest ticket hours from triage.csv
        if os.path.exists('triage.csv'):
            try:
                triage_df = pd.read_csv('triage.csv')
                if 'received_date' in triage_df.columns and 'status' in triage_df.columns:
                    open_tickets = triage_df[triage_df['status'] == 'OPEN']
                    if not open_tickets.empty:
                        # Convert to datetime and calculate ages
                        received_dates = pd.to_datetime(open_tickets['received_date'], errors='coerce')
                        now = datetime.now()
                        ages_hours = [(now - date).total_seconds() / 3600 for date in received_dates if pd.notna(date)]
                        if ages_hours:
                            metrics["oldest_ticket_hours"] = float(max(ages_hours))
                        else:
                            metrics["oldest_ticket_hours"] = 0.0
                    else:
                        metrics["oldest_ticket_hours"] = 0.0
                else:
                    metrics["oldest_ticket_hours"] = 0.0
            except Exception as e:
                print(f"Warning: Could not calculate oldest ticket hours: {e}")
                metrics["oldest_ticket_hours"] = 0.0
        else:
            metrics["oldest_ticket_hours"] = 0.0
        
        # Calculate intro→interview and intro→hire rates from events.csv
        if os.path.exists('events.csv'):
            try:
                events_df = pd.read_csv('events.csv')
                if 'interview' in events_df.columns and 'hired' in events_df.columns:
                    # Count total intros (any row in events.csv represents an introduction)
                    total_intros = len(events_df)
                    
                    if total_intros > 0:
                        # Count successful interviews and hires
                        interviews = events_df['interview'].sum() if events_df['interview'].notna().any() else 0
                        hires = events_df['hired'].sum() if events_df['hired'].notna().any() else 0
                        
                        # Calculate percentages
                        metrics["intro_interview_rate"] = round((interviews / total_intros) * 100, 1)
                        metrics["intro_hire_rate"] = round((hires / total_intros) * 100, 1)
                    else:
                        metrics["intro_interview_rate"] = 0.0
                        metrics["intro_hire_rate"] = 0.0
                else:
                    metrics["intro_interview_rate"] = 0.0
                    metrics["intro_hire_rate"] = 0.0
            except Exception as e:
                print(f"Warning: Could not calculate intro rates: {e}")
                metrics["intro_interview_rate"] = 0.0
                metrics["intro_hire_rate"] = 0.0
        else:
            metrics["intro_interview_rate"] = 0.0
            metrics["intro_hire_rate"] = 0.0
        
        # Count training events (events with interview or hire outcomes)
        if os.path.exists('events.csv'):
            try:
                events_df = pd.read_csv('events.csv')
                if 'interview' in events_df.columns and 'hired' in events_df.columns:
                    # Count events that have been labeled (interviewed=1 OR hired=1)
                    training_mask = ((events_df['interview'] == 1) | (events_df['hired'] == 1))
                    training_count = training_mask.sum()
                    metrics["training_events"] = int(training_count)
                else:
                    metrics["training_events"] = 0
            except Exception as e:
                print(f"Warning: Could not count training events: {e}")
                metrics["training_events"] = 0
        else:
            metrics["training_events"] = 0
        
        # Get last trained timestamp and weights from weights.json
        if os.path.exists('weights.json'):
            try:
                # Get file modification time
                mtime = os.path.getmtime('weights.json')
                last_trained_dt = datetime.fromtimestamp(mtime)
                metrics["last_trained"] = last_trained_dt.isoformat()
                
                # Load weights
                with open('weights.json', 'r') as f:
                    weights_data = json.load(f)
                
                if 'weights' in weights_data:
                    metrics["ml_weights"] = weights_data['weights']
                else:
                    metrics["ml_weights"] = {}
            except Exception as e:
                print(f"Warning: Could not load weights info: {e}")
                metrics["last_trained"] = None
                metrics["ml_weights"] = {}
        else:
            metrics["last_trained"] = None
            metrics["ml_weights"] = {}
        
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
        print(f"  Open tickets: {metrics['open_tickets']}")
        print(f"  Pending acks: {metrics['acks_pending']}")
        print(f"  Oldest ticket: {metrics['oldest_ticket_hours']:.1f} hours")
        print(f"  Intro-Interview rate: {metrics['intro_interview_rate']:.1f}%")
        print(f"  Intro-Hire rate: {metrics['intro_hire_rate']:.1f}%")
        print(f"  Training events: {metrics['training_events']}")
        print(f"  Last trained: {metrics['last_trained'] or 'Never'}")
        print(f"  Slots today: {metrics['slots_today']}")
        print(f"  Next review: {metrics['next_review']}")
        
    except Exception as e:
        print(f"Error generating scoreboard: {e}")
        # Write default metrics on error
        with open('scoreboard.json', 'w') as f:
            json.dump(metrics, f, indent=2)

if __name__ == "__main__":
    generate_scoreboard()