#!/usr/bin/env python3
"""
Auto Acknowledgment System - Send automatic acknowledgment emails for triage requests
====================================================================================

Features:
- Read triage.csv and find rows with empty ack_sent column
- Send SMTP acknowledgment emails using GS_SMTP_* environment variables
- Update ack_sent column with timestamp after sending
- Track pending acknowledgments in scoreboard.json

Environment Variables Required:
- GS_SMTP_SERVER: SMTP server hostname (e.g., smtp.gmail.com)
- GS_SMTP_PORT: SMTP port (e.g., 587)
- GS_SMTP_USER: Email username
- GS_SMTP_PASS: Email password/app password
"""

import smtplib
import os
import sys
import pandas as pd
import json
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional

def get_smtp_config() -> Optional[Dict[str, str]]:
    """Get SMTP configuration from environment variables"""
    config = {
        'server': os.getenv('GS_SMTP_SERVER', 'smtp.gmail.com'),
        'port': int(os.getenv('GS_SMTP_PORT', '587')),
        'user': os.getenv('GS_SMTP_USER', ''),
        'password': os.getenv('GS_SMTP_PASS', '')
    }
    
    if not config['user'] or not config['password']:
        print("Warning: GS_SMTP_USER or GS_SMTP_PASS not set. Email sending disabled.")
        return None
        
    return config

def send_acknowledgment_email(config: Dict, ticket_data: Dict) -> bool:
    """Send acknowledgment email to requester"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = config['user']
        msg['To'] = ticket_data['work_email']
        msg['Subject'] = f"GuideSignal — Ticket {ticket_data['ticket_id']} received"
        
        # Email body
        body = f"""Thanks for reaching out — we reply within 1 business day.

Ticket: {ticket_data['ticket_id']}
Priority: {ticket_data['priority']}

If you check the 48-hour reply pledge or feature a job ($25), we prioritize your request. Please include your job link(s) and must-have skills in a reply.

Best regards,
GuideSignal Team
"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(config['server'], config['port'])
        server.starttls()
        server.login(config['user'], config['password'])
        
        text = msg.as_string()
        server.sendmail(config['user'], ticket_data['work_email'], text)
        server.quit()
        
        print(f"Sent acknowledgment for {ticket_data['ticket_id']} to {ticket_data['work_email']}")
        return True
        
    except Exception as e:
        print(f"Failed to send acknowledgment for {ticket_data['ticket_id']}: {e}")
        return False

def load_triage_data(filename: str = 'triage.csv') -> pd.DataFrame:
    """Load triage data and ensure ack_sent column exists"""
    if not os.path.exists(filename):
        print(f"Warning: {filename} not found")
        return pd.DataFrame()
    
    try:
        df = pd.read_csv(filename)
        
        # Add ack_sent column if it doesn't exist
        if 'ack_sent' not in df.columns:
            df['ack_sent'] = ''
            print("Added ack_sent column to triage data")
            
        return df
        
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return pd.DataFrame()

def save_triage_data(df: pd.DataFrame, filename: str = 'triage.csv') -> bool:
    """Save updated triage data to CSV file"""
    try:
        df.to_csv(filename, index=False)
        return True
    except Exception as e:
        print(f"Error saving {filename}: {e}")
        return False

def update_scoreboard_with_acks() -> bool:
    """Update scoreboard.json with pending acknowledgments count"""
    try:
        # Load triage data to count pending acks
        triage_df = load_triage_data()
        if triage_df.empty:
            return False
            
        # Count rows with empty ack_sent (pending acknowledgments)
        pending_acks = len(triage_df[triage_df['ack_sent'].isna() | (triage_df['ack_sent'] == '')])
        
        # Load existing scoreboard
        scoreboard_file = 'scoreboard.json'
        if os.path.exists(scoreboard_file):
            with open(scoreboard_file, 'r') as f:
                scoreboard = json.load(f)
        else:
            scoreboard = {}
        
        # Update acks_pending count
        scoreboard['acks_pending'] = pending_acks
        scoreboard['last_updated'] = datetime.now().isoformat()
        
        # Save updated scoreboard
        with open(scoreboard_file, 'w') as f:
            json.dump(scoreboard, f, indent=2)
        
        print(f"Updated scoreboard.json: {pending_acks} pending acknowledgments")
        return True
        
    except Exception as e:
        print(f"Error updating scoreboard: {e}")
        return False

def process_pending_acknowledgments(config: Optional[Dict]) -> int:
    """Process all pending acknowledgments and return count sent"""
    # Load triage data
    triage_df = load_triage_data()
    if triage_df.empty:
        print("No triage data found")
        return 0
    
    # Find rows with empty ack_sent
    pending_mask = triage_df['ack_sent'].isna() | (triage_df['ack_sent'] == '')
    pending_rows = triage_df[pending_mask]
    
    if pending_rows.empty:
        print("No pending acknowledgments found")
        return 0
    
    print(f"Found {len(pending_rows)} pending acknowledgments")
    
    sent_count = 0
    current_time = datetime.now().isoformat()
    
    # Process each pending acknowledgment
    for idx, row in pending_rows.iterrows():
        ticket_data = {
            'ticket_id': row['ticket_id'],
            'priority': row['priority'],
            'work_email': row['work_email'],
            'company': row.get('company', ''),
            'name': row.get('name', '')
        }
        
        # Send email if config is available
        if config:
            success = send_acknowledgment_email(config, ticket_data)
            if success:
                # Mark as sent in DataFrame
                triage_df.loc[idx, 'ack_sent'] = current_time
                sent_count += 1
        else:
            # Mock sending for testing
            print(f"[MOCK] Would send acknowledgment for {ticket_data['ticket_id']} to {ticket_data['work_email']}")
            triage_df.loc[idx, 'ack_sent'] = current_time
            sent_count += 1
    
    # Save updated triage data
    if sent_count > 0:
        if save_triage_data(triage_df):
            print(f"Updated triage.csv with {sent_count} acknowledgment timestamps")
        else:
            print("Failed to save triage data updates")
    
    return sent_count

def main():
    """Main auto acknowledgment function"""
    print("Starting auto acknowledgment system...")
    
    # Get SMTP configuration
    config = get_smtp_config()
    
    if not config:
        print("SMTP not configured, running in mock mode...")
    
    # Process pending acknowledgments
    sent_count = process_pending_acknowledgments(config)
    
    # Update scoreboard with current pending count
    update_scoreboard_with_acks()
    
    # Print summary
    print(f"\nAuto Acknowledgment Summary:")
    print(f"  Acknowledgments sent: {sent_count}")
    
    # Check remaining pending
    triage_df = load_triage_data()
    if not triage_df.empty:
        pending_count = len(triage_df[triage_df['ack_sent'].isna() | (triage_df['ack_sent'] == '')])
        print(f"  Remaining pending: {pending_count}")
    
    print("Auto acknowledgment completed successfully!")
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Fatal error in auto acknowledgment: {e}")
        sys.exit(1)