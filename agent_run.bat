@echo off
REM GuideSignal Pipeline Execution Script
REM Runs the complete matching and learning pipeline

echo ====================================
echo GuideSignal Pipeline Execution
echo ====================================
echo.

echo [1/4] Running foundational matching model...
python foundational_model.py --applicants applicants.csv --jobs jobs.csv --out top_matches.csv
if errorlevel 1 (
    echo ERROR: Foundational model failed
    pause
    exit /b 1
)
echo ✓ Foundational model completed
echo.

echo [2/4] Processing Formspree data...
python process_formspree_data.py
if errorlevel 1 (
    echo ERROR: Formspree data processing failed
    pause
    exit /b 1
)
echo ✓ Formspree data processed
echo.

echo [3/4] Enhancing outreach with event tracking...
python enhance_outreach.py
if errorlevel 1 (
    echo ERROR: Outreach enhancement failed
    pause
    exit /b 1
)
echo ✓ Outreach enhanced
echo.

echo [4/4] Generating scoreboard...
python generate_scoreboard.py
if errorlevel 1 (
    echo ERROR: Scoreboard generation failed
    pause
    exit /b 1
)
echo ✓ Scoreboard generated
echo.

echo ====================================
echo Pipeline completed successfully!
echo ====================================
echo.
echo Output files updated:
echo - top_matches.csv
echo - top_matches_detailed.csv  
echo - outreach_emails.csv
echo - scoreboard.json
echo.
pause