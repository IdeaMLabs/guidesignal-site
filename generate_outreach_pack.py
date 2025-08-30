#!/usr/bin/env python3
"""
Generate dynamic outreach pack from template and scoreboard data.
Replaces {reply_rate} and {total_applications} placeholders with real data.
"""

import json
import os

def generate_outreach_pack():
    """Generate outreach pack with dynamic data from scoreboard.json"""
    
    try:
        # Load scoreboard data
        if not os.path.exists('scoreboard.json'):
            print("Warning: scoreboard.json not found")
            return
            
        with open('scoreboard.json', 'r') as f:
            scoreboard = json.load(f)
        
        # Extract metrics
        reply_rate = scoreboard.get('reply_rate_24h', 0)
        total_applications = scoreboard.get('last24_apps', 0)
        replied_count = scoreboard.get('last24_replied', 0)
        
        # Read the template
        if not os.path.exists('outreach_pack.txt'):
            print("Warning: outreach_pack.txt not found")
            return
            
        with open('outreach_pack.txt', 'r') as f:
            template = f.read()
        
        # Replace placeholders
        dynamic_content = template.replace('{reply_rate}', str(reply_rate))
        dynamic_content = dynamic_content.replace('{total_applications}', str(total_applications))
        dynamic_content = dynamic_content.replace('{replied_count}', str(replied_count))
        
        # Write dynamic outreach pack
        with open('outreach_pack_dynamic.txt', 'w') as f:
            f.write(dynamic_content)
            
        print(f"Dynamic outreach pack generated:")
        print(f"  Reply rate: {reply_rate}%")
        print(f"  Total apps (24h): {total_applications}")
        print(f"  Replied (24h): {replied_count}")
        print(f"  Output: outreach_pack_dynamic.txt")
        
    except Exception as e:
        print(f"Error generating dynamic outreach pack: {e}")

if __name__ == "__main__":
    generate_outreach_pack()