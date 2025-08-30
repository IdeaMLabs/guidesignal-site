# GuideSignal Website Deployment Script
# Deploys HTML files, assets, and configuration to GitHub Pages

Write-Host "Starting GuideSignal GitHub Pages deployment..." -ForegroundColor Green

# GitHub configuration
$RepoUrl = "https://$env:GH_TOKEN@github.com/YOURUSER/guidesignal-site.git"
$Branch = "main"
$CommitMessage = "Deploy GuideSignal website - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

# Define source and destination paths
$sourceDir = Get-Location
$tempDir = Join-Path $env:TEMP "guidesignal-deploy"
$webFiles = @(
    "index.html",
    "jobs.html", 
    "apply.html",
    "post.html",
    "how.html",
    "faq.html",
    "cohort.html",
    "enhanced_index.html",
    "advanced_dashboard.html",
    "privacy.html",
    "terms.html",
    "thanks.html",
    "feature.html",
    "robots.txt",
    "sitemap.xml",
    "manifest.json",
    "sw.js",
    "public_jobs.csv",
    "scoreboard.json",
    "GuideSignalLogo.png"
)

Write-Host "Source directory: $sourceDir" -ForegroundColor Yellow
Write-Host "Deployment target: GitHub Pages" -ForegroundColor Yellow

# Check GitHub token
if (-not $env:GH_TOKEN) {
    Write-Host "ERROR: GH_TOKEN environment variable not set!" -ForegroundColor Red
    Write-Host "Please set your GitHub Personal Access Token:" -ForegroundColor Yellow
    Write-Host '$env:GH_TOKEN = "your_github_token_here"' -ForegroundColor Gray
    exit 1
}

# Check if all required files exist
Write-Host "`nChecking required files..." -ForegroundColor Cyan
$missingFiles = @()
foreach ($file in $webFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file (missing)" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`nWarning: Missing files detected. Deployment will continue without them." -ForegroundColor Yellow
}

# Update public jobs and scoreboard before deployment
Write-Host "`nUpdating dynamic content..." -ForegroundColor Cyan
try {
    & python make_public_jobs.py
    Write-Host "✓ Updated public_jobs.csv" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to update public jobs" -ForegroundColor Red
}

try {
    & python generate_scoreboard.py
    Write-Host "✓ Updated scoreboard.json" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to update scoreboard" -ForegroundColor Red
}

# GitHub Pages Deployment
Write-Host "`nStarting GitHub Pages deployment..." -ForegroundColor Cyan

try {
    # Clean up any existing temp directory
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
        Write-Host "✓ Cleaned existing temp directory" -ForegroundColor Green
    }

    # Create temp directory
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    Write-Host "✓ Created temp directory: $tempDir" -ForegroundColor Green

    # Clone or initialize repository
    Set-Location $tempDir
    Write-Host "Cloning repository..." -ForegroundColor Cyan
    
    $gitOutput = & git clone $RepoUrl . 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Repository doesn't exist or clone failed. Initializing new repository..." -ForegroundColor Yellow
        & git init
        & git remote add origin $RepoUrl
        & git checkout -b $Branch
    } else {
        Write-Host "✓ Repository cloned successfully" -ForegroundColor Green
        & git checkout $Branch
    }

    # Copy website files to repository
    Write-Host "Copying website files..." -ForegroundColor Cyan
    foreach ($file in $webFiles) {
        $sourcePath = Join-Path $sourceDir $file
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath -Destination . -Force
            Write-Host "✓ Copied $file" -ForegroundColor Green
        }
    }

    # Check if there are changes to commit
    $gitStatus = & git status --porcelain 2>&1
    if (-not $gitStatus) {
        Write-Host "No changes to deploy." -ForegroundColor Yellow
        Set-Location $sourceDir
        return
    }

    # Stage and commit changes
    Write-Host "Committing changes..." -ForegroundColor Cyan
    & git add .
    & git commit -m $CommitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Changes committed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to commit changes" -ForegroundColor Red
        Set-Location $sourceDir
        exit 1
    }

    # Push to GitHub
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    & git push origin $Branch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "✓ GitHub Pages deployment completed!" -ForegroundColor Green
        Write-Host "`nYour website should be available at:" -ForegroundColor Yellow
        Write-Host "https://YOURUSER.github.io/guidesignal-site/" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Failed to push to GitHub" -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "✗ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clean up and return to original directory
    Set-Location $sourceDir
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
        Write-Host "✓ Cleaned up temp directory" -ForegroundColor Green
    }
}

Write-Host "`n🎉 GitHub Pages deployment completed successfully!" -ForegroundColor Green