# Data Model: Personal Profile Website

The site has no database. This describes the facts the page shows and where each comes from.

## Student Profile

| Field | Value | Source | Page section |
|-------|-------|--------|--------------|
| Photo | `assets/profile.webp` with `assets/profile.png` fallback (240x320, cropped 75x100 from the square original, no stretching) | Student's Downloads folder, `linkedin_profile.png` | Hero |
| Full name | I Gusti Putu Aditya Parama Nanda | Signed CV | Hero |
| Nickname | Aditya | Signed CV | Hero |
| NIM | M0405251083 | Signed CV | Hero, details |
| Study program | Artificial Intelligence, IPB University | Resume | Hero, details |
| Cohort | Angkatan 62 (AIgen 62) | Assignment, NIM | Details |
| Group | Sapphire | Student statement | Details |
| Place of birth | Jakarta | Signed CV | Details |
| Date of birth | 2 October 2007 | Signed CV | Details |
| Home address | Tangerang Selatan, Banten, Indonesia | Student statement | Details |
| Current address | Bogor, West Java, Indonesia | CV and resume | Details |
| Hobbies and interests | Games, films, retrieval-augmented generation, data analysis | CV and resume | Interests |
| Expectations | Short formal paragraph | Drafted from resume, student reviews | Expectations |

## Contact Link

| Label | Target | Source |
|-------|--------|--------|
| GitHub | `https://github.com/GPA-N` | Resume |
| LinkedIn | `https://www.linkedin.com/in/i-gusti-putu-aditya-parama-nanda-329a342a9` | Resume |
| Instagram | `https://www.instagram.com/igp.aditya.pn` | Signed CV |

## Excluded on purpose

Phone number, email address, religion, blood type, MBTI, health history, street address. See constitution
principle III.

## Background Entry

| Kind | Entry | Provider | When | Source |
|------|-------|----------|------|--------|
| Education | Bachelor's program, Artificial Intelligence | IPB University | August 2025 to present | Resume |
| Education | High school diploma, Science major | SMAS Ekayana Ehipassiko School BSD | July 2022 to June 2025 | Resume |
| Organisation | Member, Logistics | ISAC (Artificial Intelligence Student Association) | 2026 | Signed CV |
| Organisation | Member, Logistics, ISAC 2026 committee | ISAC | 2026 | Signed CV |
| Project | Gemini Flash Multimodal API | Hacktiv8 Bootcamp, Batch 19 | 2025 | Resume |
| Project | Gemini Chatbot AI | Personal project | 2025 | Resume |
| Training | AI Engineer: Modeling, GenAI, RAG and Deployment | SanberCode (PT Santai Berkualitas Syberindo) | 2026 | Signed CV |
| Training | Data and AI Agent for Data Analysis | Hacktiv8 Indonesia and IBM SkillsBuild | 2026 | Signed CV |
| Certificate | Unleashing the Power of AI Agents | IBM SkillsBuild | 2026 | Completion certificate |
| Certificate | Getting Started with Data | not stated | 2026 (set by the owner, year only) | Resume |
| Training | Cloud and Generative AI Fundamentals on AWS | Dicoding Academy | 2026 | Signed CV, resume |
| Training | Spec-Driven Development with Kiro | Dicoding Academy | 2026 | Signed CV, resume |
| Training | AI Productivity and AI API Integration for Developers | Hacktiv8 Indonesia | 2025 | Signed CV, resume |

Skills: Amazon Web Services (AWS), spec-driven software development, AI API integration, Node.js and Express.js,
Google Gemini API (resume). Motto: "Salam kebajikan" (signed CV).

## Validation rules

- Every field in the first table MUST appear in `index.html`.
- No field may contain a placeholder token such as `TODO`, `Lorem`, or `[...]`.
