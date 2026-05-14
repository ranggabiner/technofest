# MedProof — Design System Reference
> Personal health platform that combines the warmth of Family.co-style illustration with Claude's calmness: warm cream canvas as the foundation, mint teal as the medical trust signal, and blob characters that make sensitive data feel human.

**Theme:** Light · Warm & Human · Premium Trust

MedProof must make patients feel safe from the first second. Its design philosophy sits between two references: the playful warmth of Family.co (cream canvas, blob illustrations, strong display typography) and Claude's minimal calmness (wide sidebar, clean content area, hierarchy without distraction). The result is a medical platform that does not feel like a sterile clinic, but still carries the trust weight required when someone stores personal medical records. Color is used sparingly: teal is the only strong accent, cream gives the page room to breathe, and typography does the heavy lifting. Two blob characters on the landing-page hero become the face of the brand: not intimidating, not overly cheerful, but present with clear personality.

---

## 1. Visual Foundation

### 1.1 Design Philosophy

MedProof operates in an area designers rarely visit: between medical trust and human warmth. Too clinical makes patients feel like data objects. Too playful damages credibility with doctors. The solution is **deliberate restraint**: illustrations appear but do not dominate, accent colors are used rarely so every appearance matters, and display typography adds character without losing authority.

Three core principles:

1. **Trust through clarity** — Every UI element must be explainable to a non-technical patient in one sentence. Technical complexity (blockchain hash, AES-256 encryption) is hidden behind human language and subtle badges.
2. **Warmth through restraint** — Warmth does not mean busy. Cream canvas, blob characters at strategic points, and soft corner radii create an approachable feel without sacrificing professionalism.
3. **Premium through precision** — Target users are higher-end patients and doctors. Premium does not mean many colors or ornaments. Premium means precise spacing, exact typography, and interactions that feel responsive.

### 1.2 Visual References

| Reference | Adopted Elements | Elements Not Adopted |
|-----------|------------------|----------------------|
| Family.co | Warm cream canvas, blob illustrations, display typography, pill buttons, inset card borders | High character density, playful fintech feel |
| Claude (claude.ai) | Clean sidebar layout, wide content area without distraction, minimal chrome, quiet UI | Dark mode, overly sparse UI |
| Tailwind UI / Linear | Compact data tables, collapsible sidebar | Dark-first approach |

---

## 2. Color Tokens

### 2.1 Main Palette

| Name | Value | Token | Role |
|------|-------|-------|------|
| Warm Canvas | `#fbfaf9` | `--color-warm-canvas` | Page background, landing nav, light button fill |
| Stone Surface | `#f2f0ed` | `--color-stone-surface` | Card inset border, secondary button background, subtle divider |
| Parchment Card | `#f8f7f4` | `--color-parchment-card` | Feature card background, recessed dashboard panel |
| Graphite | `#474645` | `--color-graphite` | Body text, nav links, card copy; dominant text color across the platform |
| Charcoal Primary | `#343433` | `--color-charcoal-primary` | Headings, primary nav text, links |
| Midnight | `#121212` | `--color-midnight` | Dark CTA button background, high-contrast heading text |
| Obsidian | `#000000` | `--color-obsidian` | Dark surface background for critical components |
| Ash | `#848281` | `--color-ash` | Muted body text, secondary nav labels |
| Fog | `#c6c6c6` | `--color-fog` | Footer text, inactive border, divider |
| Smoke | `#a7a7a7` | `--color-smoke` | Disabled states, placeholder text, tertiary label |

### 2.2 Brand Accent (Teal)

Mint teal is the only strong accent across the platform. Its rarity is its strength: every teal element automatically draws attention. Do not use more than one teal element per viewport.

| Name | Value | Token | Role |
|------|-------|-------|------|
| Teal Primary | `#2DD4BF` | `--color-teal-primary` | Primary brand accent; CTA button, highlight icons, active sidebar element, character illustration |
| Teal Deep | `#0D9488` | `--color-teal-deep` | Teal hover state, stroke on teal illustrations, teal body links |
| Teal Muted | `#CCFBF1` | `--color-teal-muted` | Light teal badge background, subtle highlight state |
| Teal Surface | `#F0FDFA` | `--color-teal-surface` | Section background with teal context, active onboarding step |

### 2.3 Status & System Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Valid Green | `#00C454` | `--color-valid-green` | Valid input, success state, access confirmation |
| Error Red | `#EF4444` | `--color-error-red` | Error state, destructive action, invalid input |
| Warning Amber | `#F59E0B` | `--color-warning-amber` | Non-critical warning, access near expiry |
| Info Blue | `#3B82F6` | `--color-info-blue` | Neutral information, tooltip, helper text |

### 2.4 Illustration Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Illustration Teal | `#2DD4BF` | `--graphic-teal` | Primary blob character (MedProof identity) |
| Illustration Amber | `#FBBF24` | `--graphic-amber` | Secondary blob character, coins, stars, medical details |
| Illustration Coral | `#FB7185` | `--graphic-coral` | Character accent, heart elements, human-touch details |
| Illustration Lavender | `#A78BFA` | `--graphic-lavender` | Medical objects (pill, DNA, shield), supporting details |
| Illustration Amber Deep | `#D97706` | `--graphic-amber-deep` | Stroke/shadow on amber elements |
| Illustration Teal Deep | `#0D9488` | `--graphic-teal-deep` | Stroke/shadow on teal characters |

---

## 3. Typography

### 3.1 Typography Philosophy

MedProof uses the same two-font system as Family.co: **Family/Fraunces** for display and section headings, **Inter** for all UI text. This separation is critical: the display font adds character and warmth, while Inter preserves credibility and readability at every functional size.

### 3.2 Font Stack

**Family / Fraunces — Hero and section display headings only**
- Substitute: Fraunces (Google Fonts) or Playfair Display weight 500
- Weights: 500
- Sizes: 44px, 60px, 68px
- Line height: 1.09–1.10
- Letter spacing: -2.11px at 68px, -1.40px at 60px, -0.88px at 44px
- Role: Landing-page hero headline and section display heading. Maximum 2–3 instances per page. Adds warmth and personality without sacrificing readability.

**Inter — All UI text without exception**
- Weights: 400, 500, 600
- Sizes: 12px, 13px, 14px, 15px, 16px, 17px, 19px, 23px, 44px
- Line height: 1.00–1.58
- Letter spacing: Larger sizes use more negative tracking (see scale below)
- Role: Navigation, body copy, card labels, buttons, captions, forms, tables, all portal text

### 3.3 Typography Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 12px | 1.58 | -0.14px | `--text-caption` |
| caption-sm | 11px | 1.50 | -0.10px | `--text-caption-sm` |
| body-sm | 13px | 1.50 | -0.17px | `--text-body-sm` |
| body | 15px | 1.47 | -0.20px | `--text-body` |
| body-lg | 17px | 1.47 | -0.22px | `--text-body-lg` |
| heading-sm | 19px | 1.38 | -0.25px | `--text-heading-sm` |
| heading | 23px | 1.20 | -0.44px | `--text-heading` |
| heading-lg | 44px | 1.09 | -1.14px | `--text-heading-lg` |
| display-sm | 60px | 1.09 | -1.80px | `--text-display-sm` |
| display | 68px | 1.09 | -2.11px | `--text-display` |

---

## 4. Spacing & Shape

### 4.1 Base Unit

**Base unit:** 4px. All spacing is a multiple of 4.

### 4.2 Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 48 | 48px | `--spacing-48` |
| 64 | 64px | `--spacing-64` |
| 80 | 80px | `--spacing-80` |
| 96 | 96px | `--spacing-96` |
| 120 | 120px | `--spacing-120` |
| 160 | 160px | `--spacing-160` |

### 4.3 Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Tag, badge | 6px | `--radius-tag` |
| Standard card | 10px | `--radius-card` |
| Input, textarea | 10px | `--radius-input` |
| Large card | 24px | `--radius-card-lg` |
| Pill button | 32px | `--radius-pill` |
| Icon container | 40px | `--radius-icon` |
| Illustration container | 72px | `--radius-illustration` |
| Avatar | 9999px | `--radius-full` |

### 4.4 Shadows

| Name | Value | Token | Usage |
|------|-------|-------|-------|
| subtle | `color(display-p3 0.94902 0.941176 0.929412) 0px 0px 0px 1px inset` | `--shadow-subtle` | All white cards; warm inset border |
| subtle-3 | `rgba(0, 0, 0, 0.04) 0px 0px 0px 1px` | `--shadow-subtle-3` | Navigation bar outline |
| sm | `rgba(0, 0, 0, 0.04) 0px 1px 6px 0px, rgba(0, 0, 0, 0.05) 0px 0px 24px 0px` | `--shadow-sm` | Card hover state, elevated state |
| lg | `rgba(0, 0, 0, 0.15) 0px 0px 24px 0px` | `--shadow-lg` | Dark surface for critical components |
| teal-glow | `rgba(45, 212, 191, 0.15) 0px 0px 24px 0px` | `--shadow-teal` | Teal CTA button, critical active element |

---

## 5. Layout

### 5.1 Landing Page

- **Max-width:** 1200px, centered on warm canvas
- **Top Navigation:** Sticky, 64px height, logo left, links center, CTA right
- **Hero:** Full viewport, centered Family typeface headline, two blob characters to the left and right of the headline
- **Section gap:** 120–160px between sections
- **Card padding:** 32px
- **Grid:** 3 columns for feature cards, 2 columns for split content sections
- **Footer:** Minimal, link grid above canvas background

### 5.2 Portal (Post-Login — Patient, Doctor, Admin)

- **Layout:** SPA with sidebar + main content area, inspired by Claude
- **Sidebar width:** 260px (expanded), 64px (collapsed)
- **Sidebar default:** Expanded
- **Content area:** Full width after sidebar, 860px max inner content width for readability
- **Content padding:** 32px horizontal, 40px vertical
- **Portal top bar:** 56px height, breadcrumb left, user avatar + notification right
- **Collapsible sidebar:** Toggle with 0.2s ease slide animation
- **Mobile:** Sidebar becomes drawer overlay, content area full-width

### 5.3 Portal Page Structure

```
[Sidebar 260px] | [Content Area]
                  [Top Bar 56px]
                  [Main Content — max 860px inner]
```

---

## 6. Components

### 6.1 Buttons

**Primary CTA — Teal Pill**
Role: Main conversion action — "Start Free", "Grant Access", "Save Medical Record"

Background `#2DD4BF`, text `#121212` (dark on light teal for optimal contrast), border-radius 32px, padding `8px 20px`. Inter 14px weight 600. Hover: background `#0D9488`, text `#ffffff`, 0.2s ease transition. Hover box-shadow: `rgba(45, 212, 191, 0.25) 0px 0px 16px 0px`.

**Secondary CTA — Dark Pill**
Role: Alternative primary action — "Register as Doctor", "View Demo"

Background `#121212`, text `#ffffff`, border-radius 32px, padding `8px 20px`. Inter 14px weight 500. Hover: background `#343433`, 0.2s ease transition.

**Ghost Light — Cream Pill**
Role: Tertiary action — "Log In", "Cancel", "Back"

Background `#f2f0ed`, text `#121212`, border-radius 32px, padding `8px 20px`. Inter 14px weight 500.

**Destructive Button**
Role: Revoke access, delete session

Background `transparent`, border `1px solid #EF4444`, text `#EF4444`, border-radius 32px, padding `8px 20px`. Inter 14px weight 500. Hover: background `#FEF2F2`.

**Inline Text Link**
Role: Link CTA inside a paragraph or section

Background transparent, text `#2DD4BF` (or `#0D9488` on cream background), no border. Inter 14–15px weight 500. No underline, hover: text `#0D9488`.

### 6.2 Cards

**Feature Card — White**
Role: Main content card — landing feature, dashboard info panel

Background `#ffffff`, warm stone inset box-shadow `color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset`, border-radius 10px, padding 32px. Hover: add `--shadow-sm`. The inset shadow technique keeps cards flat and hand-placed on the canvas.

**Feature Card — Warm Cream**
Role: Secondary panel, screenshot container, demo preview

Background `#f8f7f4`, no shadow, border-radius 12px, padding 24px. Slightly recessed below white cards; tone difference creates one level of depth without shadow.

**Dark Surface Card**
Role: Critical component that needs full attention — important confirmation modal, critical alert, blockchain hash preview

Background `#121212`, border-radius 16px, padding 32px, box-shadow `rgba(0,0,0,0.15) 0px 0px 24px 0px`. Primary text `#ffffff`, secondary text `rgba(255,255,255,0.6)`. Use very sparingly; maximum one per page.

**Dashboard Widget Card**
Role: List-based widget in patient/doctor dashboard

Background `#ffffff`, stone inset box-shadow, border-radius 10px, padding 20px 24px. More compact than Feature Card. Inner list items use `#f2f0ed` 1px separators.

**Sidebar Card**
Role: Quick summary info in doctor sidebar

Background `#f8f7f4`, border-radius 10px, padding 16px. No shadow. Compact.

### 6.3 Navigation

**Top Navigation — Landing Page**
Background `#fbfaf9`, height 64px, box-shadow `rgba(0,0,0,0.04) 0px 0px 0px 1px`. Left logo: Family typeface 16px weight 500 `#343433` + teal shield icon. Center links: Inter 14px weight 500 `#343433`. Right: ghost cream pill "Sign In" + teal pill "Start Free".

**Sidebar — Portal**
Background `#fbfaf9` (same as canvas, border-right `1px solid #f2f0ed`). Width 260px expanded, 64px collapsed. Top logo area 64px height. Nav items: Inter 14px weight 500, normal color `#474645`, active color `#121212` with background `#f2f0ed` and 3px teal left accent. Group labels: Inter 11px weight 600 uppercase `#848281` letter-spacing 0.06em. Collapse transition: 0.2s ease, icons remain visible when collapsed.

**Top Bar — Portal**
Background `#fbfaf9`, height 56px, border-bottom `1px solid #f2f0ed`. Left breadcrumb Inter 14px `#848281` → `#343433`. Right: notification icon (bell) `#474645` + 32px round avatar + name Inter 14px `#343433`.

### 6.4 Form & Input

**Text Input**
Background `#ffffff`, border `1px solid #f2f0ed`, border-radius 10px, padding `10px 14px`. Inter 15px `#474645`. Focus: border `1.5px solid #2DD4BF`, box-shadow `rgba(45,212,191,0.12) 0px 0px 0px 3px`. Placeholder `#a7a7a7`. Valid state: border `#00C454`. Error state: border `#EF4444`.

**Textarea**
Same as Text Input. Min-height 100px. Resize: vertical only.

**Select**
Same as Text Input with right chevron `#848281`.

**Label**
Inter 13px weight 500 `#343433`, margin-bottom 6px.

**Helper Text**
Inter 12px `#848281`, margin-top 4px.

**Error Message**
Inter 12px `#EF4444`, margin-top 4px, with small warning icon.

**File Upload (KYC Doctor)**
Dashed border `1.5px dashed #c6c6c6`, border-radius 10px, background `#f8f7f4`, padding 32px, text `#848281` Inter 14px. Hover: border `#2DD4BF`, background `#F0FDFA`. Uploaded state: border `#00C454`, show file name + checkmark icon.

### 6.5 AI Chat Interface

Role: Core patient journaling and doctor RAG feature

**Chat Layout:**
- Chat container: full content-area width, max-width 720px, centered
- Patient message: right bubble, background `#2DD4BF`, text `#121212`, border-radius `18px 18px 4px 18px`, padding `10px 16px`, max-width 75%
- AI message (MedProof AI): left bubble, background `#ffffff` with stone inset shadow, text `#474645`, border-radius `18px 18px 18px 4px`, padding `10px 16px`, max-width 80%
- AI avatar: 32px circle with small teal blob character, top-left of AI bubble
- Timestamp: Inter 11px `#a7a7a7`, below bubble, right-aligned for patient, left-aligned for AI

**Typing Indicator:**
Three animated dots in the AI bubble. Round 6px dots `#2DD4BF`, bounce animation with staggered delays (0s, 0.15s, 0.30s), 0.8s infinite duration. Appears while AI processes streaming response.

**Input Area:**
Sticky bottom, background `#fbfaf9`, border-top `1px solid #f2f0ed`, padding 16px. Textarea input (1–4 auto-expanding rows), teal pill send button on the right.

**AI Disclaimer:**
Thin banner above chat area: background `#F0FDFA`, border `1px solid #CCFBF1`, Inter 12px text `#0D9488`: "MedProof AI is not a diagnostic tool. Always consult your condition with a doctor."

### 6.6 Consent Wizard (3 Steps)

Role: Patient grants access to a doctor, step by step

**Container:** Modal overlay, background `#ffffff`, border-radius 16px, padding 40px, max-width 560px, box-shadow `rgba(0,0,0,0.12) 0px 8px 32px`.

**Progress Indicator:**
Three small circles (12px) connected by a line. Completed step: teal `#2DD4BF` fill. Active step: `1.5px solid #2DD4BF` border, `#F0FDFA` fill. Incomplete step: `#f2f0ed` fill. Step label: Inter 12px `#848281` below each dot.

**Step 1 — Choose Doctor:**
Display doctor card (name, specialty, access code) from QR scan or 6-digit code input. Confirm doctor identity before continuing.

**Step 2 — Choose Scope & Duration:**
Toggle cards for: Scope 1 only / Scope 2 only / Both. Scope 2 sub-toggle: Mental health only / Physical only / Both. Access duration dropdown (1 day, 3 days, 1 week, 1 month, custom). Attachment download permission toggle.

**Step 3 — Confirm:**
Plain-language summary of access to grant. Teal pill button "Confirm & Grant Access". Small disclaimer text about revoking anytime.

### 6.7 QR Code — Modal Overlay

**Container:** Dark overlay `rgba(0,0,0,0.5)`, modal background `#ffffff`, border-radius 16px, padding 40px, max-width 360px, centered.

**Content:**
- Heading Inter 600 19px `#343433`: "Your Doctor QR Code"
- QR code container: background `#121212`, border-radius 12px, padding 20px
- Under QR: "or share access code"
- Doctor Access Code: Monospace Inter 600 28px `#343433`, background `#f8f7f4`, border-radius 10px, padding `12px 24px`, letter-spacing 0.1em, centered
- "Close" ghost cream pill button

### 6.8 Blockchain Verified Badge

Role: Subtle indicator that a medical record or event has been hashed to Polygon

**Badge Style:**
Very subtle. Background `#F0FDFA`, border `1px solid #CCFBF1`, border-radius 6px, padding `2px 8px`. Lock icon (🔒 or custom SVG) 12px `#0D9488` + Inter 11px weight 500 text `#0D9488`: "Verified on Blockchain".

**Position:** Bottom-right of medical record card or right side of audit entry header. Do not place above the fold or in a dominant position; it must be present but not compete with main content.

**Hash Display (Inline):**
For showing hash value: monospace font (font-family: `'SF Mono', 'Consolas', monospace`), Inter 11px, color `#848281`, truncated with full-hash tooltip on hover. Inline background: `#f8f7f4`, border-radius 4px, padding `1px 6px`. **Do not** use dark surface for inline hash.

### 6.9 Data Table — Audit Log

**Style:** Compact. Row height 40px. Very vertically efficient.

**Header:** Background `#f8f7f4`, border-bottom `1.5px solid #f2f0ed`. Inter 12px weight 600 uppercase `#848281` letter-spacing 0.05em.

**Row:** Alternating background: odd rows `#ffffff`, even rows `#fbfaf9`. Border-bottom `1px solid #f2f0ed`. Inter 13px `#474645`. Hover: background `#f8f7f4`.

**Cell padding:** 8px 12px horizontal, 0 vertical (vertical spacing handled by row height).

**Status cell:** Compact inline badge (see Badge component).

### 6.10 Timeline — Audit Trail

Role: Chronological visualization of sensitive patient activity

**Container:** Vertical timeline, padding-left 32px.

**Timeline line:** 2px solid `#f2f0ed`, vertical from top to bottom.

**Entry:**
- Timeline dot: 10px circle, fill `#2DD4BF` for teal/positive events, fill `#EF4444` for destructive events, fill `#848281` for neutral events. Centered on line.
- Right content: date-time Inter 12px `#848281` + event description Inter 14px `#474645` + blockchain badge when applicable
- Gap between entries: 24px

### 6.11 Badge & Label

**Status Badge:**
Border-radius 6px, padding `2px 8px`, Inter 11px weight 600.
- Active: background `#CCFBF1`, text `#0D9488`
- Expired: background `#f2f0ed`, text `#848281`
- Revoked: background `#FEE2E2`, text `#EF4444`
- Pending: background `#FEF3C7`, text `#D97706`

**Data Scope Badge:**
- Mental Health: background `#EDE9FE`, text `#7C3AED`, Inter 11px weight 500
- Physical: background `#DBEAFE`, text `#1D4ED8`, Inter 11px weight 500
- Scope 1: background `#F0FDFA`, text `#0D9488`, Inter 11px weight 500
- Scope 2: background `#FEF3C7`, text `#D97706`, Inter 11px weight 500

### 6.12 Disclaimer / Warning Component

**Medical Disclaimer:**
Background `#FEF3C7`, border-left `3px solid #F59E0B`, border-radius `0 8px 8px 0`, padding `12px 16px`. Warning triangle icon `#F59E0B` + Inter 13px text `#474645`.

Example text: *"This information is not a medical diagnosis. MedProof only stores and verifies your health data. Always consult a licensed doctor."*

**Info Banner:**
Background `#EFF6FF`, border-left `3px solid #3B82F6`, border-radius `0 8px 8px 0`, padding `12px 16px`. Info icon `#3B82F6` + Inter 13px text `#474645`.

**Success Banner:**
Background `#F0FDF4`, border-left `3px solid #00C454`, border-radius `0 8px 8px 0`, padding `12px 16px`. Check icon `#00C454` + Inter 13px text `#474645`.

**Danger Banner:**
Background `#FEF2F2`, border-left `3px solid #EF4444`, border-radius `0 8px 8px 0`, padding `12px 16px`. X icon `#EF4444` + Inter 13px text `#474645`.

---

## 7. Illustration System

### 7.1 Illustration Philosophy

MedProof's illustration system directly inherits from Family.co, adapted for a medical context. Blob characters are not decoration; they are a trust strategy: they make heavy subjects (medical data, blockchain, encryption) feel approachable. Illustrations must be minimal and deliberate: use them only when they help understanding, onboarding, or brand identity.

**Global illustration budget:** Maximum **1–5 iconic illustrations for the entire project**. Default allocation: maximum 2 illustrations on landing page, maximum 3 total illustrations across dashboard/portal. Do not create new illustrations for every page, state, or step. Prioritize clean UI, information hierarchy, spacing, typography, reusable components, and usability over visual decoration.

### 7.2 Blob Characters

**Shape vocabulary:** Organic, no rigid geometry. Imperfect round blobs with thin limbs (stick limbs), expressive dot eyes, and simple mouth curves. Each character uses one dominant color from the illustration palette, with a darker stroke for depth.

**Primary landing-page characters:**
- **Left character:** Teal blob (`#2DD4BF`) with `#0D9488` stroke, carrying a small shield or stethoscope icon; represents security and medical trust
- **Right character:** Amber blob (`#FBBF24`) with `#D97706` stroke, carrying a heart or star icon; represents care and wellness

Use only one or two characters in the hero. If two characters are used, both count as 2 from the global 1–5 illustration budget.

**Size:** 80–140px in hero. 40–60px for empty states and onboarding.

### 7.3 Medical Objects (Object Vocabulary)

These flat objects are visual vocabulary for illustrations already inside the global budget, not permission to add free decoration:
- **Shield** (`#A78BFA` fill, `#7C3AED` stroke) — data security
- **Stethoscope** (`#0D9488` fill) — doctor connection
- **Pill/Capsule** (`#FBBF24` + `#F87171` split) — Scope 1 medical record
- **Heartbeat line** (`#FB7185` fill) — health journaling
- **Lock** (`#2DD4BF` fill, `#0D9488` stroke) — blockchain proof
- **DNA helix** (`#A78BFA` fill) — medical data
- **Star** (`#FBBF24` fill) — milestone or completed AI session

### 7.4 Usage Rules

1. **Global cap:** Maximum 1–5 iconic illustrations for the whole project. Every new illustration must have a clear purpose: understanding, onboarding, or brand identity.
2. **Landing-page hero:** Maximum 2 characters around the headline. Arms/body parts may overlap text for depth. Use asymmetric positioning.
3. **Dashboard/portal:** Maximum 3 total illustrations across all dashboards and portals. Prioritize important empty states or onboarding, not decoration.
4. **Dashboard empty states:** One small character (40px) + helper text + CTA. Reuse the same asset when states are similar.
5. **Onboarding:** Use maximum one shared illustration for the wizard or use icon-only steps. Do not create a unique pose/illustration for each step.
6. **Maximum 2 characters per scene.** Do not make it dense like Family.co; MedProof needs more restraint.
7. **No illustration inside the post-login portal** except empty states and onboarding that count toward the budget. The portal is data-focused.

---

## 8. Motion

### 8.1 Motion Principles

MedProof motion must feel **confident but quiet**: it adds polish without distracting from medical data. Use motion for action confirmations (consent succeeded), page transitions, and component entrances on scroll. Do not use motion as entertainment in the portal; reserve that for the landing page.

### 8.2 Duration & Easing

| Context | Duration | Easing | Usage |
|---------|----------|--------|-------|
| Micro-interaction | 0.15s | ease | Button hover, toggle, checkbox |
| UI transition | 0.20s | ease | Background, border color, box-shadow change |
| Component entrance | 0.30s | cubic-bezier(0.19, 1, 0.22, 1) | Card appears on scroll |
| Illustration character | 1.0s | cubic-bezier(0.19, 1, 0.22, 1) | Spring bounce when page loads |
| Sidebar collapse | 0.20s | ease | Sidebar width transition |
| Modal entrance | 0.25s | cubic-bezier(0.34, 1.56, 0.64, 1) | Slight modal overshoot |
| Typing indicator | 0.80s | ease-in-out | Three-dot bounce loop |

### 8.3 Main Motion Patterns

**Illustration Characters (Landing):**
Characters enter with spring bounce on first page load. Transform: translateY(20px) → translateY(0) + scale(0.9) → scale(1). Floating idle: keyframe animation `float` with translateY(0 → -8px → 0), 3s infinite duration, ease-in-out. Left and right characters use different delays (0s and 0.5s) for a lively asymmetric effect.

**Buttons:**
Hover: `transform: translateY(-1px)`, background color transition 0.15s ease. Active: `transform: translateY(0px)` returns.

**Cards:**
Hover: `box-shadow` transition from inset stone to `--shadow-sm`, 0.20s ease.

**AI Typing Indicator:**
```css
@keyframes typing-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-4px); opacity: 1; }
}
```
Dot 1: delay 0s, Dot 2: delay 0.15s, Dot 3: delay 0.30s.

**Blockchain Badge:**
No permanent animation. Only a subtle entrance (opacity 0 → 1, 0.30s) when the medical record card first appears.

---

## 9. Portal-Specific

### 9.1 Patient Portal

**Sidebar items:**
- Dashboard (home icon)
- Medical Records — Scope 1 (file-medical icon)
- Health Journal — Scope 2 (chat/brain icon)
- AI Chat (sparkles icon)
- Doctor Access (key icon)
- History & Audit (clock icon)
- Settings (settings icon)

**Dashboard layout:** List-based. Main widgets:
1. Current active access summary (which doctor, what scope, when it expires)
2. Recent activity (mini timeline of last 5 entries)
3. Last AI session (title + date + CTA "Continue")
4. Shortcuts: "Start AI Session" + "Add Doctor Access"

### 9.2 Doctor Portal

**Sidebar items:**
- Dashboard
- Active Patients (users icon)
- Add Medical Record (file-plus icon)
- RAG AI — Ask Patient Data (brain icon)
- My QR Code (qr-code icon)
- Profile & Verification (shield-check icon)

**Dashboard layout:** List-based.
1. List of patients who granted active access
2. Allowed scope per patient + remaining duration
3. Recent add-medical-record activity
4. Doctor verification status (teal "Verified" badge or amber "Pending Approval" badge)

### 9.3 Admin Portal

**Sidebar items:**
- Dashboard
- Doctor Verification Queue (clipboard-check icon)
- Verified Doctors (user-check icon)
- Admin Activity Log (activity icon)

**Dashboard layout:** List-based.
1. Number of doctors waiting for approval (red badge counter if > 0)
2. Latest verification queue in compact table
3. Recent admin activity in timeline

---

## 10. Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 1 | Canvas | `#fbfaf9` | Page background, sidebar background; warm off-white |
| 2 | Card Surface | `#ffffff` | White card face with inset stone border |
| 3 | Recessed Panel | `#f8f7f4` | Screenshot container, secondary panel, table hover row |
| 4 | Stone Tint | `#f2f0ed` | Ghost button background, border reference, divider |
| 5 | Dark Shell | `#121212` | Dark surface for critical components, confirmation modal |

---

## 11. Responsive & Mobile

### 11.1 Breakpoints

| Name | Value | Behavior |
|------|-------|----------|
| xs | 375px | Base mobile |
| sm | 640px | Tablet portrait |
| md | 768px | Tablet landscape |
| lg | 1024px | Compact desktop |
| xl | 1280px | Standard desktop |

### 11.2 Mobile Adjustments

- **Landing-page hero:** Display font drops to 44px on mobile (from 68px desktop). Two illustration characters are positioned above and below the headline, not left and right.
- **Portal sidebar:** Becomes a drawer that appears from the left, with dark overlay `rgba(0,0,0,0.4)`. Toggle through hamburger icon in top bar.
- **Data table:** Horizontal scroll on mobile for audit tables. Prioritize columns: date, event, status. Hide hash column on mobile.
- **Consent wizard:** Full-screen modal on mobile, not centered overlay.
- **Chat interface:** Full-screen on mobile, sticky-bottom input.
- **Buttons:** Minimum touch target 44px height.

---

## 12. Do's and Don'ts

### Do
- Use `#fbfaf9` as page background; never pure white `#ffffff` at canvas level.
- Apply inset stone border to all white cards instead of regular CSS border.
- Use 32px border-radius for all pill buttons.
- Apply negative letter-spacing to all large text: -2.11px at 68px, -1.14px at 44px, scaling toward zero at body sizes.
- Limit Fraunces/Family font to display headings only (44px and 68px); Inter handles all UI text.
- Use `#2DD4BF` teal for **one UI element per viewport only**; its rarity is its strength.
- Keep the global illustration budget: 1–5 iconic illustrations for the whole project, maximum 2 on landing, maximum 3 across dashboard/portal.
- If the hero uses illustration, position characters asymmetrically and allow slight overlap with the headline bounding box.
- Include AI disclaimer on every page that displays AI output.
- Use scope badges (Mental Health, Physical) to provide visual context for Scope 2 data.

### Don't
- Do not use drop shadow on content cards; inset warm-stone border is the only surface-definition mechanism for normal cards.
- Do not use pure `#ffffff` as page background; warm cream `#fbfaf9` is the minimum warmth threshold.
- Do not use character illustrations inside the post-login portal except empty states and onboarding that count toward the global budget.
- Do not mix Inter weight 700+ with Family/Fraunces display font; maximum Inter weight is 600.
- Do not use more than one `#2DD4BF` teal element per viewport; overuse destroys visual hierarchy.
- Do not use border-radius below 10px on cards; minimum card radius is 10px.
- Do not display blockchain hash prominently; it must exist but stay subtle, available when needed.
- Do not remove the "not a medical diagnosis" disclaimer from any page or feature that uses AI.
- Do not use linear easing on visible animations; this platform is expressive, not mechanical.
- Do not use more than two illustration characters per scene.
- Do not use more than 5 iconic illustrations across the entire project.

---

## 13. CSS Custom Properties — Quick Start

```css
:root {
  /* === SURFACES === */
  --color-warm-canvas: #fbfaf9;
  --color-stone-surface: #f2f0ed;
  --color-parchment-card: #f8f7f4;

  /* === TEXT === */
  --color-graphite: #474645;
  --color-charcoal-primary: #343433;
  --color-midnight: #121212;
  --color-ash: #848281;
  --color-fog: #c6c6c6;
  --color-smoke: #a7a7a7;
  --color-obsidian: #000000;

  /* === BRAND TEAL === */
  --color-teal-primary: #2DD4BF;
  --color-teal-deep: #0D9488;
  --color-teal-muted: #CCFBF1;
  --color-teal-surface: #F0FDFA;

  /* === STATUS === */
  --color-valid-green: #00C454;
  --color-error-red: #EF4444;
  --color-warning-amber: #F59E0B;
  --color-info-blue: #3B82F6;

  /* === ILLUSTRATION === */
  --graphic-teal: #2DD4BF;
  --graphic-amber: #FBBF24;
  --graphic-coral: #FB7185;
  --graphic-lavender: #A78BFA;
  --graphic-amber-deep: #D97706;
  --graphic-teal-deep: #0D9488;

  /* === TYPOGRAPHY === */
  --font-family: 'Fraunces', ui-serif, Georgia, serif;
  --font-inter: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;

  /* === TYPE SCALE === */
  --text-caption: 12px;
  --leading-caption: 1.58;
  --tracking-caption: -0.14px;

  --text-body-sm: 13px;
  --leading-body-sm: 1.50;
  --tracking-body-sm: -0.17px;

  --text-body: 15px;
  --leading-body: 1.47;
  --tracking-body: -0.20px;

  --text-body-lg: 17px;
  --leading-body-lg: 1.47;
  --tracking-body-lg: -0.22px;

  --text-heading-sm: 19px;
  --leading-heading-sm: 1.38;
  --tracking-heading-sm: -0.25px;

  --text-heading: 23px;
  --leading-heading: 1.20;
  --tracking-heading: -0.44px;

  --text-heading-lg: 44px;
  --leading-heading-lg: 1.09;
  --tracking-heading-lg: -1.14px;

  --text-display-sm: 60px;
  --leading-display-sm: 1.09;
  --tracking-display-sm: -1.80px;

  --text-display: 68px;
  --leading-display: 1.09;
  --tracking-display: -2.11px;

  /* === SPACING === */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-96: 96px;
  --spacing-120: 120px;
  --spacing-160: 160px;

  /* === BORDER RADIUS === */
  --radius-tag: 6px;
  --radius-card: 10px;
  --radius-input: 10px;
  --radius-card-lg: 24px;
  --radius-pill: 32px;
  --radius-icon: 40px;
  --radius-illustration: 72px;
  --radius-full: 9999px;

  /* === SHADOWS === */
  --shadow-subtle: color(display-p3 0.94902 0.941176 0.929412) 0px 0px 0px 1px inset;
  --shadow-subtle-3: rgba(0, 0, 0, 0.04) 0px 0px 0px 1px;
  --shadow-sm: rgba(0, 0, 0, 0.04) 0px 1px 6px 0px, rgba(0, 0, 0, 0.05) 0px 0px 24px 0px;
  --shadow-lg: rgba(0, 0, 0, 0.15) 0px 0px 24px 0px;
  --shadow-teal: rgba(45, 212, 191, 0.15) 0px 0px 24px 0px;

  /* === LAYOUT === */
  --page-max-width: 1200px;
  --content-max-width: 860px;
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 64px;
  --topbar-height: 56px;
  --nav-height: 64px;
  --section-gap: 120px;
  --card-padding: 32px;
}
```

---

## 14. Tailwind v4 Theme

```css
@theme {
  --color-warm-canvas: #fbfaf9;
  --color-stone-surface: #f2f0ed;
  --color-parchment-card: #f8f7f4;
  --color-graphite: #474645;
  --color-charcoal-primary: #343433;
  --color-midnight: #121212;
  --color-ash: #848281;
  --color-fog: #c6c6c6;
  --color-smoke: #a7a7a7;
  --color-teal-primary: #2DD4BF;
  --color-teal-deep: #0D9488;
  --color-teal-muted: #CCFBF1;
  --color-teal-surface: #F0FDFA;
  --color-valid-green: #00C454;
  --color-error-red: #EF4444;
  --color-warning-amber: #F59E0B;
  --color-info-blue: #3B82F6;

  --font-family: 'Fraunces', ui-serif, Georgia, serif;
  --font-inter: 'Inter', ui-sans-serif, system-ui, sans-serif;

  --text-caption: 12px;
  --text-body-sm: 13px;
  --text-body: 15px;
  --text-body-lg: 17px;
  --text-heading-sm: 19px;
  --text-heading: 23px;
  --text-heading-lg: 44px;
  --text-display-sm: 60px;
  --text-display: 68px;

  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-96: 96px;
  --spacing-120: 120px;

  --radius-tag: 6px;
  --radius-card: 10px;
  --radius-input: 10px;
  --radius-card-lg: 24px;
  --radius-pill: 32px;
  --radius-icon: 40px;
  --radius-illustration: 72px;

  --shadow-subtle: color(display-p3 0.94902 0.941176 0.929412) 0px 0px 0px 1px inset;
  --shadow-subtle-3: rgba(0, 0, 0, 0.04) 0px 0px 0px 1px;
  --shadow-sm: rgba(0, 0, 0, 0.04) 0px 1px 6px 0px, rgba(0, 0, 0, 0.05) 0px 0px 24px 0px;
  --shadow-lg: rgba(0, 0, 0, 0.15) 0px 0px 24px 0px;
  --shadow-teal: rgba(45, 212, 191, 0.15) 0px 0px 24px 0px;
}
```

---

## 15. Prompt Guide for AI Agents

### Quick Color Reference

```
Page background:       #fbfaf9 (warm cream — never pure white)
Primary text:          #474645 (Graphite)
Heading text:          #343433 (Charcoal Primary)
CTA button (teal):     #2DD4BF background, #121212 text
CTA button (dark):     #121212 background, #ffffff text
CTA button (ghost):    #f2f0ed background, #121212 text
Brand accent / link:   #2DD4BF (Teal Primary) — use sparingly, max 1x per viewport
Card border:           inset box-shadow ~#f2f0ed 1px
Muted text:            #848281 (Ash)
Error:                 #EF4444
Success:               #00C454
```

### Component Prompt Examples

**1. Hero Landing Page:**
Background `#fbfaf9`. Center-aligned headline with Fraunces 500 68px, color `#343433`, letter-spacing -2.11px, line-height 1.09. Subtext 16px Inter 400 `#474645`, max-width 480px. Two pill buttons below: teal (`#2DD4BF` background, `#121212` text, 32px radius) and dark (`#121212` background, `#ffffff` text, 32px radius). Maximum two blob characters: left teal `#2DD4BF` carrying shield, right amber `#FBBF24` carrying heart. Size 100–120px, asymmetric position, arms overlap headline bounds. Both count as 2 from the global 1–5 project illustration budget.

**2. Patient Dashboard:**
Sidebar 260px background `#fbfaf9`, border-right `1px solid #f2f0ed`. Active item: background `#f2f0ed`, border-left `3px solid #2DD4BF`, text `#121212`. Content area padding 32px, inner content max-width 860px. List-based widgets with card background `#ffffff`, stone inset shadow, border-radius 10px, padding 20px 24px.

**3. AI Chat Interface:**
Container max-width 720px. Patient bubble right: background `#2DD4BF`, text `#121212`, border-radius `18px 18px 4px 18px`. AI bubble left: background `#ffffff`, stone inset shadow, text `#474645`, border-radius `18px 18px 18px 4px`. Typing indicator: 3 dots `#2DD4BF` with bounce animation delays 0s, 0.15s, 0.30s. Disclaimer banner above chat: background `#F0FDFA`, border `1px solid #CCFBF1`, teal text `#0D9488` 12px.

**4. Consent Wizard:**
Modal `#ffffff`, border-radius 16px, padding 40px, max-width 560px. Progress 3 steps: 12px dots, active teal border, completed teal fill, incomplete stone fill. Step labels Inter 12px `#848281`. Final-step CTA: teal pill "Confirm & Grant Access".

**5. Blockchain Badge:**
Background `#F0FDFA`, border `1px solid #CCFBF1`, border-radius 6px, padding `2px 8px`. Lock SVG icon 12px `#0D9488` + Inter 11px weight 500 text `#0D9488`: "Verified". Position bottom-right of medical record card.

**6. Audit Timeline:**
Padding-left 32px, vertical line 2px `#f2f0ed`. Timeline dot 10px: positive teal `#2DD4BF`, destructive `#EF4444`, neutral `#848281`. Right content: date Inter 12px `#848281` + 14px description `#474645`. Gap between entries 24px.
```
