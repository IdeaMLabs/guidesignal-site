#!/usr/bin/env python3
"""
Triage Sync System - Process intro request emails and update tracking
=====================================================================

Features:
- IMAP email fetching using GS_IMAP_* environment variables
- Parse Formspree intro emails with format: [HIGH|NORMAL] Introduction Request GS-####
- Extract ticket ID, priority, company, role from email content
- Create/update triage.csv with request tracking
- Update scoreboard.json with open_tickets count
- Comprehensive logging and error handling

Environment Variables Required:
- GS_IMAP_SERVER: IMAP server hostname (e.g., imap.gmail.com)
- GS_IMAP_PORT: IMAP port (e.g., 993)
- GS_IMAP_USER: Email username
- GS_IMAP_PASS: Email password/app password
"""

import imaplib
import email
import os
import sys
import pandas as pd
import json
import re
from datetime import datetime, timedelta
from email.header import decode_header
from typing import Dict, List, Optional, Tuple

def get_imap_config() -> Dict[str, str]:
    """Get IMAP configuration from environment variables"""
    config = {
        'server': os.getenv('GS_IMAP_SERVER', 'imap.gmail.com'),
        'port': int(os.getenv('GS_IMAP_PORT', '993')),
        'user': os.getenv('GS_IMAP_USER', ''),
        'password': os.getenv('GS_IMAP_PASS', '')
    }
    
    if not config['user'] or not config['password']:
        print("Warning: GS_IMAP_USER or GS_IMAP_PASS not set. Using mock data.")
        return None
        
    return config

def decode_mime_words(s: str) -> str:
    """Decode MIME encoded words in email headers"""
    try:
        decoded_parts = decode_header(s)
        decoded_string = ''
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                decoded_string += part.decode(encoding or 'utf-8', errors='ignore')
            else:
                decoded_string += part
        return decoded_string.strip()
    except Exception:
        return str(s).strip()

def parse_intro_email(msg) -> Optional[Dict]:
    """Parse intro request email and extract relevant information"""
    try:
        # Get subject
        subject = decode_mime_words(msg.get('Subject', ''))
        
        # Check if this is an intro request email
        ticket_pattern = r'\[(?P<priority>HIGH|NORMAL)\]\s*Introduction Request\s+(?P<ticket_id>GS-\d+)'
        match = re.search(ticket_pattern, subject, re.IGNORECASE)
        
        if not match:
            return None
            
        ticket_id = match.group('ticket_id')
        priority = match.group('priority').upper()
        
        # Get email content
        content = ""
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                if content_type == "text/plain":
                    payload = part.get_payload(decode=True)
                    if payload:
                        content += payload.decode('utf-8', errors='ignore')
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                content = payload.decode('utf-8', errors='ignore')
        
        # Parse form data from content
        parsed_data = {
            'ticket_id': ticket_id,
            'priority': priority,
            'subject': subject,
            'received_date': datetime.now().isoformat(),
            'status': 'OPEN',
            'company': '',
            'roles': '',
            'openings': '',
            'name': '',
            'work_email': '',
            'urgency': '',
            'pledge_48h': False,
            'question': ''
        }
        
        # Extract form fields from content using regex patterns
        field_patterns = {
            'name': r'name[:\s]+([^\n\r]+)',
            'work_email': r'work[_\s]*email[:\s]+([^\n\r]+)',
            'company': r'company[:\s]+([^\n\r]+)',
            'roles': r'role.*seeking[:\s]+([^\n\r]+)',
            'openings': r'openings[:\s]+(\d+)',
            'urgency': r'urgency[:\s]+([^\n\r]+)',
            'pledge_48h': r'pledge[_\s]*48h[:\s]+(true|on|yes|1)',
            'question': r'question.*context[:\s]+([^\n\r]+.*?)(?=\n\n|\n[A-Za-z]+:|$)'
        }
        
        for field, pattern in field_patterns.items():
            match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if match:
                value = match.group(1).strip()
                if field == 'pledge_48h':
                    parsed_data[field] = value.lower() in ['true', 'on', 'yes', '1']
                else:
                    parsed_data[field] = value
        
        return parsed_data
        
    except Exception as e:
        print(f"Error parsing email: {e}")
        return None

def fetch_intro_emails(config: Dict) -> List[Dict]:
    """Fetch intro request emails from IMAP server"""
    if not config:
        # Return mock data for testing
        print("Using mock email data for testing...")
        return [
            {
                'ticket_id': 'GS-20250830001',
                'priority': 'HIGH',
                'subject': '[HIGH] Introduction Request GS-20250830001',
                'received_date': datetime.now().isoformat(),
                'status': 'OPEN',
                'company': 'TechCorp Solutions',
                'roles': 'Help Desk Technician, IT Support',
                'openings': '2',
                'name': 'Sarah Johnson',
                'work_email': 'sarah.johnson@techcorp.com',
                'urgency': 'high',
                'pledge_48h': True,
                'question': 'Looking for candidates with Windows and ticketing experience'
            },
            {
                'ticket_id': 'GS-20250830002',
                'priority': 'NORMAL',
                'subject': '[NORMAL] Introduction Request GS-20250830002',
                'received_date': (datetime.now() - timedelta(hours=2)).isoformat(),
                'status': 'OPEN',
                'company': 'Local Business Inc',
                'roles': 'Customer Support Representative',
                'openings': '1',
                'name': 'Mike Chen',
                'work_email': 'mike@localbusiness.com',
                'urgency': 'medium',
                'pledge_48h': False,
                'question': 'Need someone who can start within 2 weeks'
            }
        ]
    
    emails = []
    try:
        # Connect to IMAP server
        mail = imaplib.IMAP4_SSL(config['server'], config['port'])
        mail.login(config['user'], config['password'])
        
        # Select inbox
        mail.select('INBOX')
        
        # Search for intro request emails (last 30 days)
        since_date = (datetime.now() - timedelta(days=30)).strftime('%d-%b-%Y')
        search_criteria = f'(SINCE {since_date} SUBJECT "Introduction Request GS-")'
        
        status, message_ids = mail.search(None, search_criteria)
        
        if status == 'OK':
            for msg_id in message_ids[0].split():
                try:
                    # Fetch email
                    status, msg_data = mail.fetch(msg_id, '(RFC822)')
                    if status == 'OK':
                        email_body = msg_data[0][1]
                        msg = email.message_from_bytes(email_body)
                        
                        # Parse email
                        parsed = parse_intro_email(msg)
                        if parsed:
                            emails.append(parsed)
                            
                except Exception as e:
                    print(f"Error processing email {msg_id}: {e}")
                    continue
        
        mail.logout()
        
    except Exception as e:
        print(f"Error connecting to IMAP server: {e}")
        return []
    
    return emails

def load_triage_data(filename: str = 'triage.csv') -> pd.DataFrame:
    """Load existing triage data or create new DataFrame"""
    if os.path.exists(filename):
        try:
            return pd.read_csv(filename)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
    
    # Create new DataFrame with required columns
    columns = [
        'ticket_id', 'priority', 'status', 'received_date', 'company', 'roles', 
        'openings', 'name', 'work_email', 'urgency', 'pledge_48h', 'question',
        'assigned_date', 'closed_date', 'notes'
    ]
    return pd.DataFrame(columns=columns)

def update_triage_data(df: pd.DataFrame, new_emails: List[Dict]) -> pd.DataFrame:
    """Update triage DataFrame with new email data"""
    updated = False
    
    for email_data in new_emails:
        ticket_id = email_data['ticket_id']
        
        # Check if ticket already exists
        if ticket_id in df['ticket_id'].values:
            # Update existing ticket if needed
            idx = df[df['ticket_id'] == ticket_id].index[0]
            if df.loc[idx, 'status'] != 'CLOSED':
                # Update with latest data
                for key, value in email_data.items():
                    if key in df.columns:
                        df.loc[idx, key] = value
                updated = True
        else:
            # Add new ticket
            new_row = email_data.copy()
            new_row.update({
                'assigned_date': '',
                'closed_date': '',
                'notes': ''
            })
            df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
            updated = True
    
    if updated:
        # Sort by received_date descending (newest first)
        df = df.sort_values('received_date', ascending=False).reset_index(drop=True)
    
    return df

def save_triage_data(df: pd.DataFrame, filename: str = 'triage.csv') -> bool:
    """Save triage data to CSV file"""
    try:
        df.to_csv(filename, index=False)
        return True
    except Exception as e:
        print(f"Error saving {filename}: {e}")
        return False

def update_scoreboard_with_tickets(triage_df: pd.DataFrame) -> bool:
    """Update scoreboard.json with open tickets count"""
    try:
        # Count open tickets
        open_tickets = len(triage_df[triage_df['status'] == 'OPEN'])
        
        # Load existing scoreboard
        scoreboard_file = 'scoreboard.json'
        if os.path.exists(scoreboard_file):
            with open(scoreboard_file, 'r') as f:
                scoreboard = json.load(f)
        else:
            scoreboard = {}
        
        # Update open_tickets count
        scoreboard['open_tickets'] = open_tickets
        scoreboard['last_updated'] = datetime.now().isoformat()
        
        # Save updated scoreboard
        with open(scoreboard_file, 'w') as f:
            json.dump(scoreboard, f, indent=2)
        
        print(f"Updated scoreboard.json: {open_tickets} open tickets")
        return True
        
    except Exception as e:
        print(f"Error updating scoreboard: {e}")
        return False

def main():
    """Main triage sync function"""
    print("Starting triage sync...")
    
    # Get IMAP configuration
    config = get_imap_config()
    
    # Fetch intro emails
    print("Fetching intro request emails...")
    emails = fetch_intro_emails(config)
    print(f"Found {len(emails)} intro request emails")
    
    # Load existing triage data
    print("Loading triage data...")
    triage_df = load_triage_data()
    print(f"Loaded {len(triage_df)} existing triage records")
    
    # Update triage data with new emails
    print("Processing new emails...")
    updated_df = update_triage_data(triage_df, emails)
    
    # Save updated triage data
    if save_triage_data(updated_df):
        print(f"Saved triage.csv with {len(updated_df)} total records")
    
    # Update scoreboard with open tickets count
    if update_scoreboard_with_tickets(updated_df):
        open_count = len(updated_df[updated_df['status'] == 'OPEN'])
        print(f"Updated scoreboard: {open_count} open tickets")
    
    # Print summary
    print("\nTriage Sync Summary:")
    print(f"  Total tickets: {len(updated_df)}")
    print(f"  Open tickets: {len(updated_df[updated_df['status'] == 'OPEN'])}")
    print(f"  High priority: {len(updated_df[(updated_df['status'] == 'OPEN') & (updated_df['priority'] == 'HIGH')])}")
    print(f"  Normal priority: {len(updated_df[(updated_df['status'] == 'OPEN') & (updated_df['priority'] == 'NORMAL')])}")
    
    if len(updated_df) > 0:
        print("\nRecent tickets:")
        recent = updated_df.head(3)[['ticket_id', 'priority', 'company', 'status']]
        print(recent.to_string(index=False))
    
    print("Triage sync completed successfully!")
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Fatal error in triage sync: {e}")
        sys.exit(1)