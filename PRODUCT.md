# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Primary: lecturers and assignment graders at IPB University reviewing the AIgen 62 Digital Portfolio. (Inferred from the README; not confirmed by the owner.)
- Secondary: classmates and people who meet the owner through the assignment and want a quick, accurate overview. (Inferred.)

## Product Purpose

A personal profile site for I Gusti Putu Aditya Parama Nanda, Artificial Intelligence student at IPB University, Angkatan 62 (AIgen 62). It was built for the AIgen 62 Digital Portfolio assignment.

Success: a reviewer finds the owner's details, education, projects, training, skills, interests, and expectations within seconds, and every fact on the page is accurate and sourced from the owner.

## Positioning

An owner-authored, single-page profile with no framework, no build step, and no runtime dependencies. The owner's own portrait, wording, and records are the content; the visual language is a red-noir treatment with a live WebGL background and a spinnable portrait card.

## Operating Context

- Viewed in desktop and mobile browsers, most likely during academic review.
- Published with GitHub Pages from the `main` branch of the repository. There is no server and no build step.
- Content is edited by hand in `index.html`. After changes to `styles.css`, `fluid.js`, `motion.js`, or the portrait, asset URLs are versioned with `node tools/stamp.mjs`, then checked with `node tests/check-profile.mjs`.

## Capabilities and Constraints

Capabilities:
- Sections: Details, Education, Projects, Training, Skills, Interests, Expectations, and Contact.
- Interactive: fluid WebGL background (the page works without it), drag-to-spin portrait whose back face switches the colour theme, press-in cards, animated headings, magnetic buttons, and a scroll-tracking navigation.
- Contact is limited to public profile links: GitHub, LinkedIn, and Instagram.

Constraints:
- Static files only. No external scripts, fonts, or network calls at runtime. Inter and Manrope are self-hosted.
- Transfer budget: 150 KB (FR-014).
- Content must read correctly with JavaScript disabled and with WebGL unavailable.
- Address at city level only. No phone number, email address, religion, blood type, or MBTI on the page.
- No contact form.

Terminology: "AIgen 62", "IPB University", "Artificial Intelligence" (program name).

Undecided: none recorded.

## Brand Commitments

- Name as written by the owner: I Gusti Putu Aditya Parama Nanda.
- Voice: formal English.
- No em dashes or en dashes in visible text. Hyphens only.
- One "Contact me" label across the page.
- No custom mouse cursor.
- Motion stays on for every visitor, regardless of the operating system's reduced-motion setting. This is an owner decision.

## Evidence on Hand

- Portrait: `assets/profile.png` and `assets/profile.webp` (low-resolution source, about 100 px in the source image).
- Social card image: `assets/og.jpg`.
- Owner content inside `index.html`: details, education, projects, training, skills, interests, and expectations.
- Absent, and must not be fabricated: testimonials, client work, metrics, benchmark numbers, logos of partners or employers, and quotes from third parties.

## Product Principles

1. Owner facts only. Every claim on the page comes from the owner, and new claims need a source in the repository.
2. Content survives without scripts or WebGL. The page is readable in both cases.
3. Motion is part of the design and always on, but never flashes and never blocks content.
4. Static and dependency-free. Hosting stays a plain static deployment.
5. Quiet authority. Plain wording and restrained styling over claims of expertise.

## Accessibility & Inclusion

- Text contrast meets WCAG 2.1 AA.
- Keyboard use: skip link, navigation links, and the portrait (arrow keys spin it, Enter switches theme on the back face).
- No flashing content. The diamond on the back face blinks slowly, under three flashes per second.
- Known tension: motion stays on regardless of the reduced-motion setting, by owner decision. Drag-driven motion stops on release.
