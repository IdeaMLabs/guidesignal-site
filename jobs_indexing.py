#!/usr/bin/env python3
"""
Google Indexing API client for job postings.
Automatically submits JobPosting URLs to Google for immediate indexing.

Usage:
    python jobs_indexing.py

Requirements:
    - pip install google-auth google-api-python-client
    - Service account JSON in secrets/service-account.json
    - Service account must have Indexing API permissions
"""

import json
import xml.etree.ElementTree as ET
from pathlib import Path
import sys
from urllib.parse import urlparse
import time

try:
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except ImportError:
    print("Error: Missing required packages. Install with:")
    print("pip install google-auth google-api-python-client")
    sys.exit(1)

# Configuration
SITEMAP_PATH = "sitemap.xml"
SERVICE_ACCOUNT_FILE = "secrets/service-account.json"
SCOPES = ['https://www.googleapis.com/auth/indexing']

def load_credentials():
    """Load Google service account credentials."""
    if not Path(SERVICE_ACCOUNT_FILE).exists():
        print(f"Error: Service account file not found: {SERVICE_ACCOUNT_FILE}")
        print("Please add your Google service account JSON file to secrets/")
        return None
    
    try:
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES
        )
        return credentials
    except Exception as e:
        print(f"Error loading credentials: {e}")
        return None

def extract_job_urls_from_sitemap():
    """Extract job posting URLs from sitemap.xml."""
    if not Path(SITEMAP_PATH).exists():
        print(f"Error: Sitemap not found: {SITEMAP_PATH}")
        return []
    
    try:
        tree = ET.parse(SITEMAP_PATH)
        root = tree.getroot()
        
        # Handle XML namespace
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        job_urls = []
        for url_elem in root.findall('ns:url', namespace):
            loc_elem = url_elem.find('ns:loc', namespace)
            if loc_elem is not None and '/jobs/' in loc_elem.text:
                job_urls.append(loc_elem.text)
        
        return job_urls
    except ET.ParseError as e:
        print(f"Error parsing sitemap: {e}")
        return []

def submit_url_to_indexing_api(service, url):
    """Submit a single URL to Google Indexing API."""
    request_body = {
        'url': url,
        'type': 'URL_UPDATED'
    }
    
    try:
        request = service.urlNotifications().publish(body=request_body)
        response = request.execute()
        return response
    except HttpError as e:
        print(f"HTTP Error for {url}: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error for {url}: {e}")
        return None

def main():
    """Main function to process job URLs and submit to Indexing API."""
    print("🔍 Google Indexing API - Job Posting Submitter")
    print("=" * 50)
    
    # Load credentials
    print("Loading service account credentials...")
    credentials = load_credentials()
    if not credentials:
        return 1
    
    # Build service
    try:
        service = build('indexing', 'v3', credentials=credentials)
        print("✅ Connected to Google Indexing API")
    except Exception as e:
        print(f"Error building service: {e}")
        return 1
    
    # Extract job URLs from sitemap
    print(f"Parsing sitemap: {SITEMAP_PATH}")
    job_urls = extract_job_urls_from_sitemap()
    
    if not job_urls:
        print("No job URLs found in sitemap")
        return 0
    
    print(f"Found {len(job_urls)} job URLs:")
    for url in job_urls:
        print(f"  - {url}")
    
    # Submit URLs to Indexing API
    print("\nSubmitting URLs to Google Indexing API...")
    success_count = 0
    
    for i, url in enumerate(job_urls, 1):
        print(f"[{i}/{len(job_urls)}] Submitting: {url}")
        
        response = submit_url_to_indexing_api(service, url)
        if response:
            print(f"  ✅ Success: {response.get('urlNotificationMetadata', {}).get('url', 'N/A')}")
            success_count += 1
        else:
            print(f"  ❌ Failed")
        
        # Rate limiting: small delay between requests
        if i < len(job_urls):
            time.sleep(0.5)
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📊 Summary:")
    print(f"  Total URLs: {len(job_urls)}")
    print(f"  Successful: {success_count}")
    print(f"  Failed: {len(job_urls) - success_count}")
    
    if success_count == len(job_urls):
        print("🎉 All job URLs successfully submitted for indexing!")
    elif success_count > 0:
        print("⚠️  Some URLs failed - check error messages above")
    else:
        print("❌ No URLs were successfully submitted")
    
    return 0 if success_count > 0 else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)