@echo off
setlocal enabledelayedexpansion
echo DEBUG: Script started.
pause

:: ================================================================
:: REPOSYNC - The Ultimate Git Sync Utility (v2.3.2)
:: "Foolproof Edition" - Auto-Recovery & Divergence Handling
:: MIT License - Copyright (c) 2026 cijamie
:: ================================================================

:: 1. Setup Colors (Simplified for Compatibility)
set "G=" & set "R=" & set "C=" & set "Y=" & set "M=" & set "W=" & set "B="
for /f "tokens=2 delims==" %%a in ('set ^| findstr /I "ESC" 2^>nul') do set "ESC=%%a"
if not defined ESC (
    for /f "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do set "ESC=%%b"
)
if defined ESC (
    set "G=%ESC%[92m" & set "R=%ESC%[91m" & set "C=%ESC%[96m" & set "Y=%ESC%[93m" & set "M=%ESC%[95m" & set "W=%ESC%[0m" & set "B=%ESC%[5m"
)

:: 2. Argument Parsing
set "ARG1=%~1"
set "IS_DRY=0"
if /i "%ARG1%"=="--dry" set "IS_DRY=1"
if /i "%ARG1%"=="-d" set "IS_DRY=1"

:: 3. Pre-Checks
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed.
    goto :error_exit
)

for /f "tokens=*" %%i in ('git rev-parse --show-toplevel 2^>nul') do set "REPO_ROOT=%%i"
if "%REPO_ROOT%"=="" (
    echo [ERROR] Not a Git repository.
    goto :error_exit
)
cd /d "%REPO_ROOT%"

:: 4. Conflict Marker Detection
echo %C%[0/8]%W% Checking for unresolved conflict markers...
git grep -l "<<<" . > conflict_check.tmp 2>nul
set "HAS_REAL_CONFLICTS=0"
if exist conflict_check.tmp (
    for /f "usebackq tokens=*" %%f in ("conflict_check.tmp") do (
        set "fname=%%f"
        if /i not "!fname!"=="reposync.bat" (
            if !HAS_REAL_CONFLICTS! equ 0 (
                echo %R%[ALERT]%W% Found merge conflict markers in:
                set "HAS_REAL_CONFLICTS=1"
            )
            echo      - %%f
        )
    )
    del conflict_check.tmp >nul 2>&1
)

if %HAS_REAL_CONFLICTS% equ 1 (
    echo %Y%[HELP]%W% Please resolve these manually before running RepoSync.
    goto :error_exit
)

:: 5. Identity & Remote Detection
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref @{u} 2^>nul') do set "UPSTREAM=%%i"
if defined UPSTREAM (
    for /f "tokens=1 delims=/" %%a in ("%UPSTREAM%") do set "REMOTE=%%a"
    for /f "tokens=1,* delims=/" %%a in ("%UPSTREAM%") do set "BRANCH=%%b"
) else (
    for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set "BRANCH=%%i"
    for /f "tokens=*" %%i in ('git remote 2^>nul ^| findstr "origin"') do set "REMOTE=%%i"
    if "!REMOTE!"=="" (for /f "tokens=*" %%i in ('git remote 2^>nul') do set "REMOTE=%%i")
)

title RepoSync v2.3.2 - %BRANCH% @ %REMOTE%
echo %C%================================================================%W%
echo           %G%REPOSYNC v2.3.2 - FOOLPROOF SYNC UTILITY%W%
echo           Target: %Y%%BRANCH%%W% on %Y%%REMOTE%%W%
echo %C%================================================================%W%

:: 6. Connectivity & Fetch
echo %C%[1/8]%W% Verifying connectivity and fetching updates...
git fetch %REMOTE% %BRANCH% >nul 2>&1
if %errorlevel% neq 0 (
    echo %R%[ERROR]%W% Remote '%REMOTE%' is unreachable.
    goto :error_exit
)

:: 7. State Analysis
set "AHEAD=0"
for /f "tokens=*" %%i in ('git rev-list --count %REMOTE%/%BRANCH%..HEAD 2^>nul') do set "AHEAD=%%i"
set "BEHIND=0"
for /f "tokens=*" %%i in ('git rev-list --count HEAD..%REMOTE%/%BRANCH% 2^>nul') do set "BEHIND=%%i"
set "DIRTY=0"
for /f "tokens=*" %%i in ('git status --porcelain') do set "DIRTY=1"

echo      Status: Ahead [%G%%AHEAD%%W%] Behind [%R%%BEHIND%%W%] Dirty [%Y%%DIRTY%%W%]

:: 8. Self-Healing
if exist ".git\rebase-merge" (
    echo %R%[ALERT]%W% Rebase interrupted. Attempting auto-fix...
    git rebase --continue >nul 2>&1 || (
        echo %R%[FAIL]%W% Could not auto-continue.
        goto :error_exit
    )
)

git log -1 --pretty=format:%%s 2>nul | findstr "TEMP: RepoSync auto-save" >nul
if %errorlevel% equ 0 (
    echo %Y%[RECOVERY]%W% Removing leftover TEMP commit...
    git reset --soft HEAD~1
    set "DIRTY=1"
)

:: 9. Sync Logic
:sync_start
if %DIRTY% equ 1 (
    echo %C%[2/8]%W% Creating temporary save point...
    if %IS_DRY% equ 0 (
        git add -A
        git commit -m "TEMP: RepoSync auto-save" >nul 2>&1
    )
)

if %BEHIND% gtr 0 (
    echo %C%[3/8]%W% Integrating remote changes...
    if %IS_DRY% equ 0 (
        git pull --rebase %REMOTE% %BRANCH%
        if !errorlevel! neq 0 (
            echo %R%[CONFLICT]%W% Manual resolution required.
            goto :error_exit
        )
    )
)

git log -1 --pretty=format:%%s 2>nul | findstr "TEMP: RepoSync auto-save" >nul
if %errorlevel% equ 0 (
    echo %C%[4/8]%W% Restoring your changes...
    if %IS_DRY% equ 0 git reset --soft HEAD~1
)

:: 10. Commit Workflow
echo %C%[5/8]%W% Finalizing changes...
set "HAS_FINAL=0"
for /f "tokens=*" %%i in ('git status --porcelain') do set "HAS_FINAL=1"

if %HAS_FINAL% equ 0 (
    if %AHEAD% equ 0 if %BEHIND% equ 0 (
        echo %G%[ ALREADY UP TO DATE ]%W%
        goto :end
    )
    goto :push_logic
)

echo.
echo %G%[ CHANGELOG SUMMARY ]%W%
git status --short
echo.

echo %C%[6/8]%W% Ready to commit...
set "msg=%ARG1%"
if /i "%msg%"=="--dry" set "msg="
if /i "%msg%"=="-d" set "msg="

if not defined msg (
    set /p msg="[%G%ENTER COMMIT MESSAGE%W% (blank for auto)]: "
)
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm'"`) do set "TS=%%i"
if "%msg%"=="" set "msg=Update %TS%"

if %IS_DRY% equ 0 (
    git add -A
    git commit -m "!msg!"
)

:: 11. Push Logic
:push_logic
echo %C%[7/8]%W% Pushing to %REMOTE%/%BRANCH%...
if %IS_DRY% equ 0 (
    git push %REMOTE% %BRANCH%
    if !errorlevel! neq 0 (
        echo %Y%[RETRY]%W% Push failed. Emergency re-sync...
        git fetch %REMOTE% %BRANCH% >nul 2>&1
        set "BEHIND=1"
        set "DIRTY=0"
        goto :sync_start
    )
    echo.
    echo %G%[ SUCCESS - Repository fully synced! ]%W%
)

:end
echo.
pause
exit /b 0

:error_exit
echo.
echo [ CRITICAL ERROR ] Script terminated.
pause
exit /b 1
