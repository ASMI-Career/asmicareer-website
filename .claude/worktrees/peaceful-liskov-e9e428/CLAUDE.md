# ASMI Career — asmicareer.in Project

## Who I Am
I am not a professional developer. I run ASMI Career, a NEET medical 
admissions counselling company in Maharashtra, India with 11+ years of 
experience and 25,000+ admissions. Always explain what you are doing and 
why in simple terms. Never assume I know developer jargon.

## Project Purpose
asmicareer.in is our public-facing website deployed on Netlify. It handles:
- Student inquiry forms (saves to Google Sheets)
- Counsellor consultation dashboard (dashboard.html)
- Future: events page, rank predictor, college database

## Tech Stack
- Plain HTML, CSS, JavaScript — NO frameworks like React or Vue
- Google Apps Script for form-to-Google Sheet connection
- Netlify for hosting (drag and drop deployment)
- No build process, no npm, no package.json

## File Structure
- index.html — Main inquiry form (live at asmicareer.in)
- dashboard.html — Counsellor session dashboard (private)
- cutoff-data.json — 2025 NEET cutoffs by state, category, course

## Critical Rules — Never Break These
1. Never remove or change the Google Apps Script URL in index.html
   (scriptURL variable) — this is what sends form data to our Sheet
2. All pages must work on mobile — most users are on phones
3. Test that forms still submit after any changes
4. Keep file sizes small — our users are often on slow mobile data
5. Never use external libraries that require internet to load
   (always use CDN links as fallback, not local installs)

## Brand
- Company: ASMI Career
- Colors: use existing colors from index.html, don't change branding
- Tone: Professional, warm, trustworthy — parents and students are 
  the audience, not tech people
- Language: English UI, but content may reference Hindi/Marathi terms

## Business Context
- Target users: NEET students (17-18 years) and their parents in Maharashtra
- Counselling covers: MBBS, BDS, BAMS, BHMS, BPTH courses
- Key states: Maharashtra, Karnataka, Gujarat, MP, UP, Rajasthan
- Categories: Open, OBC, SC, ST, EWS, NRI
- Score range we work with: 300–720 NEET marks

## NEET Counselling Domain Knowledge
- MCC = Medical Counselling Committee (All India quota)
- State quota = 85% seats reserved for state domicile students  
- AIQ = All India Quota (15% seats, open to all states)
- Cutoff = closing rank of last student admitted in previous year
- Our dashboard compares student score vs tentative 2026 cutoffs

## Google Sheet Integration
- Inquiry form submissions → Google Apps Script → Google Sheet
- Each branch has its own sheet tab
- Dashboard reads student data via ?row= URL parameter
- Apps Script web app URL is in index.html — preserve it always

## How to Deploy
1. Make changes to files
2. Drag the entire folder to Netlify
3. Site goes live automatically at asmicareer.in
4. No build steps, no terminal commands needed for deployment

## What We Are Building Next
1. Events/Seminar booking page (/events.html)
2. Rank predictor tool
3. College database with search/filter
4. Documents checklist page
Each new page must match the navbar and footer style of index.html