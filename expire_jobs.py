#!/usr/bin/env python3
"""
Job expiration manager for GuideSignal job postings.
Automatically handles expired jobs by:
1. Setting <meta name="robots" content="noindex"> on expired job pages
2. Removing expired job URLs from sitemap.xml
3. Preserving page content but preventing search indexing

Usage:
    python expire_jobs.py [--dry-run]

The script checks validThrough dates in JSON-LD and expires jobs accordingly.
"""

import json
import xml.etree.ElementTree as ET
from pathlib import Path
import re
from datetime import datetime, timezone
import argparse
import sys
from urllib.parse import urlparse

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Manage expired job postings")
    parser.add_argument("--dry-run", action="store_true", 
                       help="Show what would be changed without making changes")
    return parser.parse_args()

def extract_job_data_from_page(file_path):
    """Extract job data from HTML page including validThrough date."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract JSON-LD script content
        json_ld_match = re.search(
            r'<script type="application/ld\+json">\s*({.*?})\s*</script>', 
            content, 
            re.DOTALL
        )
        
        if not json_ld_match:
            return None, content
        
        try:
            job_data = json.loads(json_ld_match.group(1))
            return job_data, content
        except json.JSONDecodeError as e:
            print(f"Warning: Invalid JSON-LD in {file_path}: {e}")
            return None, content
            
    except FileNotFoundError:
        print(f"Warning: File not found: {file_path}")
        return None, None
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None, None

def is_job_expired(job_data):
    """Check if job has expired based on validThrough date."""
    if not job_data or 'validThrough' not in job_data:
        return False
    
    try:
        valid_through_str = job_data['validThrough']
        # Parse ISO format date
        if valid_through_str.endswith('Z'):
            valid_through = datetime.fromisoformat(valid_through_str[:-1]).replace(tzinfo=timezone.utc)
        else:
            valid_through = datetime.fromisoformat(valid_through_str).replace(tzinfo=timezone.utc)
        
        now = datetime.now(timezone.utc)
        return now > valid_through
        
    except (ValueError, TypeError) as e:
        print(f"Warning: Invalid validThrough date format: {valid_through_str} - {e}")
        return False

def has_noindex_meta(content):
    """Check if page already has noindex meta tag."""
    if not content:
        return False
    return 'content="noindex' in content.lower()

def add_noindex_meta(content):
    """Add noindex meta tag to page content."""
    # Replace existing robots meta tag or add new one
    robots_pattern = r'<meta\s+name="robots"\s+content="[^"]*"[^>]*>'
    
    if re.search(robots_pattern, content, re.IGNORECASE):
        # Replace existing robots meta tag
        new_content = re.sub(
            robots_pattern,
            '<meta name="robots" content="noindex, nofollow">',
            content,
            flags=re.IGNORECASE
        )
    else:
        # Add new robots meta tag after viewport
        viewport_pattern = r'(<meta\s+name="viewport"[^>]*>)'
        if re.search(viewport_pattern, content, re.IGNORECASE):
            new_content = re.sub(
                viewport_pattern,
                r'\1\n    <meta name="robots" content="noindex, nofollow">',
                content,
                flags=re.IGNORECASE
            )
        else:
            # Fallback: add after charset
            charset_pattern = r'(<meta\s+charset="[^"]*">)'
            new_content = re.sub(
                charset_pattern,
                r'\1\n    <meta name="robots" content="noindex, nofollow">',
                content,
                flags=re.IGNORECASE
            )
    
    return new_content

def get_job_files():
    """Get all job HTML files."""
    jobs_dir = Path("jobs")
    if not jobs_dir.exists():
        return []
    
    return list(jobs_dir.glob("*.html"))

def remove_urls_from_sitemap(expired_urls, dry_run=False):
    """Remove expired job URLs from sitemap.xml."""
    sitemap_path = Path("sitemap.xml")
    if not sitemap_path.exists():
        print("Warning: sitemap.xml not found")
        return False
    
    try:
        tree = ET.parse(sitemap_path)
        root = tree.getroot()
        
        # Handle XML namespace
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        removed_count = 0
        for url_elem in root.findall('ns:url', namespace):
            loc_elem = url_elem.find('ns:loc', namespace)
            if loc_elem is not None and loc_elem.text in expired_urls:
                if not dry_run:
                    root.remove(url_elem)
                removed_count += 1
                print(f"  - Removed from sitemap: {loc_elem.text}")
        
        if removed_count > 0 and not dry_run:
            # Write updated sitemap
            tree.write(sitemap_path, encoding='utf-8', xml_declaration=True)
            print(f"✅ Updated sitemap.xml (removed {removed_count} URLs)")
        elif dry_run and removed_count > 0:
            print(f"[DRY RUN] Would remove {removed_count} URLs from sitemap")
        
        return removed_count > 0
        
    except ET.ParseError as e:
        print(f"Error parsing sitemap.xml: {e}")
        return False

def main():
    """Main function to process expired jobs."""
    args = parse_args()
    
    print("🕒 Job Expiration Manager")
    print("=" * 40)
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
        print()
    
    # Get all job files
    job_files = get_job_files()
    if not job_files:
        print("No job files found in jobs/ directory")
        return 0
    
    print(f"Checking {len(job_files)} job files...")
    
    expired_jobs = []
    expired_urls = []
    updated_files = 0
    
    # Process each job file
    for job_file in job_files:
        job_data, content = extract_job_data_from_page(job_file)
        
        if not job_data:
            print(f"⚠️  Skipping {job_file.name}: No valid JSON-LD found")
            continue
        
        job_title = job_data.get('title', 'Unknown')
        job_url = job_data.get('url', '')
        
        if is_job_expired(job_data):
            print(f"⏰ Expired: {job_title} ({job_file.name})")
            expired_jobs.append(job_file)
            if job_url:
                expired_urls.append(job_url)
            
            # Check if already has noindex
            if has_noindex_meta(content):
                print(f"  ✅ Already has noindex meta tag")
            else:
                print(f"  📝 Adding noindex meta tag")
                if not args.dry_run:
                    new_content = add_noindex_meta(content)
                    with open(job_file, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    updated_files += 1
                else:
                    print(f"  [DRY RUN] Would add noindex meta tag")
        else:
            valid_through = job_data.get('validThrough', 'Unknown')
            print(f"✅ Active: {job_title} (expires {valid_through})")
    
    # Update sitemap if there are expired URLs
    if expired_urls:
        print(f"\nUpdating sitemap.xml...")
        remove_urls_from_sitemap(expired_urls, args.dry_run)
    
    # Summary
    print("\n" + "=" * 40)
    print(f"📊 Summary:")
    print(f"  Total jobs checked: {len(job_files)}")
    print(f"  Expired jobs: {len(expired_jobs)}")
    print(f"  Files updated: {updated_files}")
    print(f"  URLs removed from sitemap: {len(expired_urls)}")
    
    if args.dry_run and (expired_jobs or expired_urls):
        print(f"\n💡 Run without --dry-run to apply changes")
    elif expired_jobs:
        print(f"\n🎉 Expired jobs successfully processed!")
    else:
        print(f"\n✨ No expired jobs found - all jobs are active!")
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)