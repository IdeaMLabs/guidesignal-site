#!/usr/bin/env python3
"""
Daily Digest System - Send daily triage summary emails
======================================================

Features:
- Read triage.csv and compute open tickets by priority
- List 5 oldest open tickets with ages in hours
- Add oldest_ticket_hours to scoreboard.json
- Email daily summary to GS_SMTP_FROM address

Environment Variables Required:
- GS_SMTP_SERVER: SMTP server hostname (e.g., smtp.gmail.com)
- GS_SMTP_PORT: SMTP port (e.g., 587)
- GS_SMTP_USER: Email username for sending
- GS_SMTP_PASS: Email password/app password
- GS_SMTP_FROM: Email address to send digest to
"""

import smtplib
import os
import sys
import pandas as pd
import json
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional, Tuple

def get_smtp_config() -> Optional[Dict[str, str]]:
    """Get SMTP configuration from environment variables"""
    config = {
        'server': os.getenv('GS_SMTP_SERVER', 'smtp.gmail.com'),
        'port': int(os.getenv('GS_SMTP_PORT', '587')),
        'user': os.getenv('GS_SMTP_USER', ''),
        'password': os.getenv('GS_SMTP_PASS', ''),
        'from_email': os.getenv('GS_SMTP_FROM', '')
    }
    
    if not config['user'] or not config['password']:
        print("Warning: GS_SMTP_USER or GS_SMTP_PASS not set. Email sending disabled.")
        return None
    
    if not config['from_email']:
        print("Warning: GS_SMTP_FROM not set. Using SMTP_USER as recipient.")
        config['from_email'] = config['user']
        
    return config

def load_triage_data(filename: str = 'triage.csv') -> pd.DataFrame:
    """Load triage data"""
    if not os.path.exists(filename):
        print(f"Warning: {filename} not found")
        return pd.DataFrame()
    
    try:
        df = pd.read_csv(filename)
        
        # Convert received_date to datetime if it's not already
        if 'received_date' in df.columns:
            df['received_date'] = pd.to_datetime(df['received_date'], errors='coerce')
            
        return df
        
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return pd.DataFrame()

def calculate_ticket_age_hours(received_date: datetime) -> float:
    """Calculate ticket age in hours"""
    try:
        if pd.isna(received_date):
            return 0.0
        
        now = datetime.now()
        # Handle timezone-naive datetime
        if received_date.tzinfo is None:
            age_delta = now - received_date
        else:
            # Convert to naive datetime for comparison
            age_delta = now - received_date.replace(tzinfo=None)
            
        return age_delta.total_seconds() / 3600
    except Exception:
        return 0.0

def analyze_triage_data(df: pd.DataFrame) -> Dict:
    """Analyze triage data and return summary statistics"""
    if df.empty:
        return {
            'total_open': 0,
            'high_priority': 0,
            'normal_priority': 0,
            'oldest_tickets': [],
            'oldest_ticket_hours': 0.0
        }
    
    # Filter open tickets
    open_tickets = df[df['status'] == 'OPEN'].copy()
    
    if open_tickets.empty:
        return {
            'total_open': 0,
            'high_priority': 0,
            'normal_priority': 0,
            'oldest_tickets': [],
            'oldest_ticket_hours': 0.0
        }
    
    # Count by priority
    high_priority = len(open_tickets[open_tickets['priority'] == 'HIGH'])
    normal_priority = len(open_tickets[open_tickets['priority'] == 'NORMAL'])
    
    # Calculate ages and sort by oldest
    open_tickets['age_hours'] = open_tickets['received_date'].apply(calculate_ticket_age_hours)
    oldest_tickets = open_tickets.nlargest(5, 'age_hours')
    
    # Get oldest ticket age
    oldest_ticket_hours = open_tickets['age_hours'].max() if not open_tickets.empty else 0.0
    
    # Format oldest tickets list
    oldest_list = []
    for _, ticket in oldest_tickets.iterrows():
        age_hours = ticket['age_hours']
        days = int(age_hours // 24)
        hours = int(age_hours % 24)
        
        if days > 0:
            age_str = f"{days}d {hours}h"
        else:
            age_str = f"{int(age_hours)}h"
            
        oldest_list.append({
            'ticket_id': ticket['ticket_id'],
            'priority': ticket['priority'],
            'company': ticket.get('company', 'N/A'),
            'age_str': age_str,
            'age_hours': age_hours
        })
    
    return {
        'total_open': len(open_tickets),
        'high_priority': high_priority,
        'normal_priority': normal_priority,
        'oldest_tickets': oldest_list,
        'oldest_ticket_hours': float(oldest_ticket_hours)
    }

def update_scoreboard_with_oldest(oldest_hours: float) -> bool:
    """Update scoreboard.json with oldest ticket hours"""
    try:
        # Load existing scoreboard
        scoreboard_file = 'scoreboard.json'
        if os.path.exists(scoreboard_file):
            with open(scoreboard_file, 'r') as f:
                scoreboard = json.load(f)
        else:
            scoreboard = {}
        
        # Update oldest_ticket_hours
        scoreboard['oldest_ticket_hours'] = oldest_hours
        scoreboard['last_updated'] = datetime.now().isoformat()
        
        # Save updated scoreboard
        with open(scoreboard_file, 'w') as f:
            json.dump(scoreboard, f, indent=2)
        
        print(f"Updated scoreboard.json: oldest ticket is {oldest_hours:.1f} hours old")
        return True
        
    except Exception as e:
        print(f"Error updating scoreboard: {e}")
        return False

def format_digest_email(analysis: Dict) -> Tuple[str, str]:
    """Format the digest email subject and body"""
    date_str = datetime.now().strftime('%Y-%m-%d')
    
    subject = f"GuideSignal Daily Triage Digest - {date_str}"
    
    # Build email body
    body_lines = [
        f"GuideSignal Triage Summary for {date_str}",
        "=" * 50,
        "",
        f"OPEN TICKETS SUMMARY:",
        f"  Total Open: {analysis['total_open']}",
        f"  High Priority: {analysis['high_priority']}",
        f"  Normal Priority: {analysis['normal_priority']}",
        "",
    ]
    
    if analysis['oldest_tickets']:
        body_lines.extend([
            f"OLDEST OPEN TICKETS:",
            ""
        ])
        
        for i, ticket in enumerate(analysis['oldest_tickets'], 1):
            body_lines.append(
                f"  {i}. {ticket['ticket_id']} ({ticket['priority']}) - {ticket['company']} - {ticket['age_str']} old"
            )
        
        body_lines.extend(["", ""])
    
    if analysis['oldest_ticket_hours'] > 48:
        body_lines.extend([
            "ATTENTION NEEDED:",
            f"  Oldest ticket is {analysis['oldest_ticket_hours']:.1f} hours old (>48h)",
            ""
        ])
    elif analysis['oldest_ticket_hours'] > 24:
        body_lines.extend([
            "FOLLOW UP SOON:",
            f"  Oldest ticket is {analysis['oldest_ticket_hours']:.1f} hours old (>24h)",
            ""
        ])
    
    body_lines.extend([
        "---",
        "This is an automated daily digest from GuideSignal triage system.",
        f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    ])
    
    return subject, "\n".join(body_lines)

def send_digest_email(config: Dict, subject: str, body: str) -> bool:
    """Send digest email"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = config['user']
        msg['To'] = config['from_email']
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(config['server'], config['port'])
        server.starttls()
        server.login(config['user'], config['password'])
        
        text = msg.as_string()
        server.sendmail(config['user'], config['from_email'], text)
        server.quit()
        
        print(f"Sent daily digest to {config['from_email']}")
        return True
        
    except Exception as e:
        print(f"Failed to send digest email: {e}")
        return False

def main():
    """Main daily digest function"""
    print("Starting daily digest generation...")
    
    # Get SMTP configuration
    config = get_smtp_config()
    
    # Load and analyze triage data
    print("Loading triage data...")
    triage_df = load_triage_data()
    
    print("Analyzing triage data...")
    analysis = analyze_triage_data(triage_df)
    
    # Update scoreboard with oldest ticket hours
    update_scoreboard_with_oldest(analysis['oldest_ticket_hours'])
    
    # Format email
    subject, body = format_digest_email(analysis)
    
    # Print summary to console
    print(f"\nDaily Digest Summary:")
    print(f"  Total open tickets: {analysis['total_open']}")
    print(f"  High priority: {analysis['high_priority']}")
    print(f"  Normal priority: {analysis['normal_priority']}")
    print(f"  Oldest ticket: {analysis['oldest_ticket_hours']:.1f} hours")
    print(f"  Oldest 5 tickets: {len(analysis['oldest_tickets'])}")
    
    # Send email if configured
    if config:
        print(f"\nSending digest email to {config['from_email']}...")
        success = send_digest_email(config, subject, body)
        if not success:
            print("Failed to send email")
    else:
        print("\nSMTP not configured, skipping email send")
        print("Email would contain:")
        print("-" * 50)
        print(f"Subject: {subject}")
        print()
        print(body)
        print("-" * 50)
    
    print("Daily digest completed successfully!")
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Fatal error in daily digest: {e}")
        sys.exit(1)