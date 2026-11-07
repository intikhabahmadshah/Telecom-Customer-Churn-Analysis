@echo off
title Push Telecom Churn Analytics to GitHub
echo ==============================================================================
echo   PUSHING TO GITHUB REPOSITORY
echo   Target: https://github.com/intikhabahmadshah/Telecom-Customer-Churn-Analysis
echo ==============================================================================
echo.
echo Make sure you have created the empty repository on GitHub first:
echo https://github.com/new (Name: Telecom-Customer-Churn-Analysis)
echo.
git push -u origin main
echo.
pause
