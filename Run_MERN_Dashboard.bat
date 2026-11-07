@echo off
title Telecom Customer Churn Analytics Dashboard
echo ==============================================================================
echo   STARTING TELECOM CUSTOMER CHURN ANALYTICS DASHBOARD
echo ==============================================================================
echo.
echo Starting Express Server and opening dashboard in browser...
start "" "http://localhost:3000"
node server.js
pause
