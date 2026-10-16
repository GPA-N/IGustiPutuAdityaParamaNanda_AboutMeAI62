# Feature Specification: Personal Profile Website (AIgen 62 Digital Portfolio)

**Feature Branch**: `001-personal-profile-site`

**Created**: 2026-10-10

**Status**: Draft

**Input**: User description: "Build a personal profile website for the AIgen 62 Digital Portfolio assignment. It must show a photo, full name, NIM, study program, cohort, group, place and date of birth, home address, current address, hobbies or interests, expectations as an Artificial Intelligence student, and optional social media or contact links. Publish it through GitHub Pages in a public repository named NIM_NamaLengkap_AboutMeAI62 and shorten the URL with ipb.link. Write the page in formal English."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Identify the student at a glance (Priority: P1)

A lecturer or teaching assistant opens the page and immediately sees who the student is: photo, full name,
NIM, study program, cohort, and group, together with the other required personal details.

**Why this priority**: These fields are the assignment's mandatory content. Without them the submission fails.

**Independent Test**: Open the page and check each required field against the assignment list. Delivers a
complete, gradable submission by itself.

**Acceptance Scenarios**:

1. **Given** the page is open, **When** the visitor reads the top section, **Then** the photo, full name, NIM,
   study program, cohort, and group are visible without scrolling on a desktop screen.
2. **Given** the page is open, **When** the visitor scrolls, **Then** place and date of birth, home address,
   current address, hobbies or interests, and expectations are each present under a clear heading.
3. **Given** the photo file fails to load, **When** the page renders, **Then** meaningful alternative text
   identifies the student.

---

### User Story 2 - Read comfortably on any device (Priority: P2)

A grader opens the link on a phone, laptop, or projector and finds the layout readable and professional.

**Why this priority**: Part of the assignment's goal is UI quality and a professional identity.

**Independent Test**: View the page at 360 px, 768 px, and 1440 px widths. No horizontal scrolling, no
overlapping text, and all content readable.

**Acceptance Scenarios**:

1. **Given** a 360 px wide screen, **When** the page loads, **Then** content stacks in a single column with no
   horizontal scrolling.
2. **Given** a desktop screen, **When** the page loads, **Then** the layout uses the width without lines of
   text becoming uncomfortably long.
3. **Given** JavaScript is disabled, **When** the page loads, **Then** all required content is still visible.

---

### User Story 3 - Reach the student and verify the submission (Priority: P3)

A visitor follows links to the student's public profiles, and the student can submit two working URLs
(GitHub Pages and ipb.link) to Google Classroom.

**Why this priority**: Contact links are optional in the assignment, but a working published URL is required
for submission.

**Independent Test**: Click every link on the page and open the GitHub Pages URL from a different network.

**Acceptance Scenarios**:

1. **Given** the page is open, **When** the visitor clicks a social or contact link, **Then** it opens the
   correct public profile.
2. **Given** the repository is published, **When** anyone opens the GitHub Pages URL, **Then** the same page
   loads with all assets.
3. **Given** the short link is created, **When** anyone opens it, **Then** it redirects to the GitHub Pages URL.

---

### Edge Cases

- A very long full name must wrap without breaking the layout on a 360 px screen.
- A missing or slow photo must not shift the layout once it loads.
- Visitors using a screen reader must hear the section headings and the photo description.
- Printing the page must produce a clean one- or two-page profile.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page MUST display the student's photo with descriptive alternative text.
- **FR-002**: The page MUST display the full name, NIM, study program, cohort, and group.
- **FR-003**: The page MUST display place and date of birth, home address, and current address.
- **FR-004**: The page MUST display hobbies or interests.
- **FR-005**: The page MUST display the student's expectations during their time in the Artificial
  Intelligence study program.
- **FR-006**: The page MUST provide links to the student's public GitHub, LinkedIn, and Instagram, and every
  "Contact me" button MUST lead to one of them.
- **FR-007**: All visible text MUST be formal English.
- **FR-008**: The page MUST NOT show a phone number, email address, religion, blood type, or a street-level address.
- **FR-009**: The page MUST render correctly from 360 px to 1440 px width without horizontal scrolling.
- **FR-010**: The page MUST show all required content with JavaScript disabled and when WebGL is unavailable.
- **FR-011**: The page MUST be published at a public GitHub Pages URL from a public repository named
  `M0405251083_IGustiPutuAdityaParamaNanda_AboutMeAI62`.
- **FR-012**: A short link `ipb.link/M0405251083-IGustiPutuAdityaParamaNanda-aboutmeAI62` MUST redirect to the
  published page.

- **FR-013**: The page MUST use a dark red-and-black visual theme with an animated background that reacts
  to the pointer, never reduces text contrast below WCAG AA, and is optional (see FR-010).
- **FR-016**: Motion is always on. The page ignores the visitor's reduced-motion setting and has no motion switch
  (owner's decision, 2026-10-10). Nothing flashes, and drag-driven motion stops when the visitor lets go.
- **FR-018**: The page MUST include these interactions: (a) a card or contact link under the pointer sinks at the
  pointer position and its far edge lifts, springing back on leave; (b) the portrait can be dragged to rotate in 3D,
  keeps spinning after a flick with exponential decay, then settles on the nearest face (front, or back after a flip), and can be spun with the arrow keys;
  (c) headings reveal letter by letter (fade in, slide up, blur to sharp) while keeping their real text for assistive
  technology; (d) the fluid background leaves a soft, lingering haze after the pointer stops and reacts gently to clicks, and scrolling does not change it; it MUST feel calm, not busy (owner feedback 2026-10-10); (e) a tap on the red diamond on the portrait's back face, or Enter on the focused portrait, switches the page between red and steel (a greyscale with a cool cast). The new theme opens as a blob that grows out of the portrait card until it covers the page, with a mesh of small squares along its edge; the fluid tint follows the same wave. No view transition is used, so every browser with canvas and CSS clip-path shows it. The choice is not stored between visits.
- **FR-014**: The page MUST stay light: under 150 KB transferred (raised from 100 KB by the owner, 2026-10-11) in total, and mobile lab LCP under 2.5 s.

- **FR-017**: The page MUST present the student's education, organisations, projects, skills, and training as
  recorded in their CV and resume, each with its provider and year, and MUST NOT include any item those
  documents do not contain.

- **FR-015**: A visitor MUST never see new page markup styled by an older cached stylesheet or script: asset URLs
  change whenever the asset changes.

### Key Entities

- **Student Profile**: The set of personal facts shown on the page: photo, names, NIM, program, cohort,
  group, birth place and date, addresses, hobbies, expectations.
- **Contact Link**: A labelled link to a public profile.
- **Background Entry**: A dated item of education, organisation, project, or training with its provider.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A grader can find all 11 required profile items in under 1 minute.
- **SC-002**: In a mobile lab run (Lighthouse, simulated slow 4G, cold cache) the published page reaches LCP
  in 2.5 s or less.
- **SC-003**: At 360 px, 768 px, and 1440 px widths, 0 instances of horizontal scrolling or overlapping text.
- **SC-004**: 100% of links on the page open the correct destination.
- **SC-005**: Both submission URLs (GitHub Pages and ipb.link) open the page for a visitor who is not signed
  in to any account.
- **SC-006**: A mobile lab run scores 95 or higher for performance, with 0 ms total blocking time and 0 layout shift.

## Assumptions

- **Cohort**: "Angkatan 62" (AIgen 62), derived from the assignment title and the 2025 intake year in the NIM.
- **Group**: Sapphire, as stated by the student.
- **Birth place and date**: Jakarta, 2 October 2007, taken from the student's final signed CV. An older draft
  of the CV says Bogor; the signed version is treated as authoritative.
- **Home address**: Tangerang Selatan, Banten, as stated by the student (city level only).
- **Photo**: The student's square profile photo (`linkedin_profile.png`, 100x100), cropped to 3:4 without stretching.
  The earlier `profile_3x4.png` was that same square photo stretched vertically by a third (measured: squeezing it
  back to a square matches the original with an error of 1.7), so it was replaced. The source is only 100 px wide,
  so the portrait is soft; a larger original would fix that.
- **Hobbies**: Playing games and watching films (from the CV), plus interests drawn from the student's resume
  (retrieval-augmented generation, data analysis). AI API integration and spec-driven development are listed
  under Skills instead, so no item appears in both bands.
- **Expectations**: Drafted in formal English. At the student's request the text claims no existing strength in
  mathematics or machine learning and does not use any Hugging Face material; it expresses goals to learn,
  build, collaborate, and apply AI usefully.
- **Current address**: Confirmed by the student as Bogor, West Java.
- **Contact links**: GitHub `GPA-N`, LinkedIn `i-gusti-putu-aditya-parama-nanda-329a342a9`, and Instagram `igp.aditya.pn`.
  The student asked on 2026-10-10 for the email address to be removed from the page.
- **Background**: Education, organisations, projects, skills, and training come from the signed CV, the resume,
  and the IBM SkillsBuild completion certificate. Course titles that are in Indonesian are translated into
  formal English. The phone number, religion, blood type, MBTI result, health history, and the resume's job-search
  sentence are left out on purpose.
- **Motto**: "Salam kebajikan" is taken from the CV and shown with an English gloss.
- **Motion**: Because the owner's Windows has Animation effects off, honouring the system setting hid every effect from
  them. At their request the page now always animates. This is an accessibility trade-off the owner accepted; content
  stays readable without JavaScript or WebGL.
- **Out of scope**: Multi-page navigation, a blog, a contact form, analytics, and any backend.
- **Manual steps outside the repository**: Creating the ipb.link short link and submitting both URLs in
  Google Classroom are done by the student.
