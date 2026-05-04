# CLAUDE.md

## Purpose
This project is Ryan Blood's EverPass presentation factory.

Use it to create polished, reusable HTML presentations for EverPass Media with a consistent structure, clean visual style, embedded talk track bullets, and presenter view by default.

## User context
- Ryan Blood is Chief Content Officer at EverPass Media.
- Ryan prefers HTML-based presentations and internal tools.
- Ryan wants presentations to feel clean, minimal, polished, and easy to follow.
- Many presentations are used live in meetings, video calls, onboarding sessions, and internal reviews.
- Presentations should be understandable to mixed-expertise audiences unless a specialist audience is clearly requested.

## Working directory constraints — HARD RULES
- **Never** treat the Windows Desktop (`C:\Users\ryan\Desktop`) as a project root.
- **Never** create `.claude` folders or `CLAUDE.md` files on the Desktop.
- Keep all Claude project metadata, scaffolding, skills, and shells inside the EverPass tree:
  `C:\Users\ryan\OneDrive - EverPass Media\EVERPASS`
- Presentation scaffolding lives under:
  `C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\EVERPASS TOOLS\Presentations`
- Finished presentations save to:
  `C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\EVERPASS TOOLS`
- Maintain visual cleanliness on the Desktop: no new files or folders there unless Ryan explicitly requests them by path.
- If a prior session dropped `.claude` or `CLAUDE.md` on the Desktop, treat those as misplaced artifacts — do not use, do not rely on, and remove once correct versions are in place.

## Default output location
Finished presentation files save to:

`C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\EVERPASS TOOLS`

Stay inside this folder unless Ryan explicitly says otherwise.

## Default deliverable
Default to a single self-contained HTML presentation file.

Every presentation should include by default:
- slide navigation
- embedded talk-track bullets for each slide
- presenter view in the same HTML file
- keyboard shortcut `P` to open presenter view
- synced presenter + deck navigation
- next-slide preview
- elapsed timer
- no scrolling inside slides

## Approved shell rule
Use the approved EverPass presentation shell as the base for all new presentations.

Shell location:
`C:\Users\ryan\OneDrive - EverPass Media\EVERPASS\EVERPASS TOOLS\Presentations\everpass-presentation-shell.html`

When creating a new presentation:
1. Copy the approved shell first
2. Save it under a new descriptive filename in `EVERPASS TOOLS`
3. Replace placeholder slide content, notes, and slide count as needed
4. Preserve the shell architecture, presenter mode, navigation, and house styling unless Ryan explicitly asks for a redesign

Do not rebuild the presentation framework from scratch if the shell can be reused.

## Visual defaults
Default visual style:
- super clean
- modern
- minimal
- readable
- polished
- EverPass-consistent in tone and palette

Avoid by default:
- heavy animation
- busy backgrounds
- dense text
- tiny bullets
- generic AI-looking layouts
- unnecessary decoration

## Content defaults
By default:
- organize content into a clear narrative
- keep each slide focused on one idea
- use full-sentence takeaway slide titles where appropriate
- prioritize clarity over jargon
- write for the actual audience
- keep decks concise unless Ryan requests otherwise

## Speaker notes defaults
Always include concise talk-track bullets for every slide, even if Ryan does not explicitly ask.

Notes should:
- be bullet-based, not a script
- support natural speaking
- help in live calls and recordings
- feel practical and conversational

## File naming
Use descriptive, lowercase, hyphenated filenames.

Examples:
- everpass-content-qa-companion.html
- everpass-market-realities.html
- onboarding-content-followup.html

Do not use vague names like final.html or test2.html.

## Workflow
When Ryan asks for a presentation:
1. Use the approved shell as the base
2. Copy it to a new descriptive filename
3. Adapt slide count and content to the request
4. Preserve presenter view, notes system, and navigation unless asked otherwise
5. Save the finished file to `EVERPASS TOOLS`
6. Return a short explanation of what was created and where it was saved

## Technical constraints
- Prefer stable HTML/CSS/JS
- Keep dependencies light
- Avoid storage patterns that may break in restricted browser contexts
- Keep slides viewport-fitted with no scrolling
- Keep presenter notes hidden from the audience-facing view

## House style summary
If no other style direction is given, use:
- EverPass-style clean corporate theme
- Apple-minimal + strategy-clean tone
- strong spacing
- readable bullets
- restrained color usage
- subtle polish
- executive clarity
