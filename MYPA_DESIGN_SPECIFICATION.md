# MYPA Design Specification
## Pixel-Perfect UI Specification Document

> Every measurement, color, and component defined precisely.
> Copy these specs directly into Figma or code.

---

# SECTION 1: COLOR SPECIFICATION

## 1.1 Background Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| `bg-black` | `#000000` | 0, 0, 0 | Main app background, always |
| `bg-surface-1` | `#0D0D0D` | 13, 13, 13 | Slightly elevated areas, headers |
| `bg-surface-2` | `#161616` | 22, 22, 22 | Cards, list items, modals |
| `bg-surface-3` | `#1C1C1E` | 28, 28, 30 | Interactive elements, inputs, pressed states |
| `bg-surface-4` | `#2C2C2E` | 44, 44, 46 | Hover states, selected items |

## 1.2 Brand Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| `brand-primary` | `#7C3AED` | 124, 58, 237 | Primary buttons, orb core, key accents |
| `brand-secondary` | `#A78BFA` | 167, 139, 250 | Secondary accents, links, highlights |
| `brand-tertiary` | `#C4B5FD` | 196, 181, 253 | Subtle accents, icon tints |
| `brand-muted` | `#4C1D95` | 76, 29, 149 | Dark purple for backgrounds, borders |

## 1.3 Text Colors

| Name | Hex | Opacity | Usage |
|------|-----|---------|-------|
| `text-primary` | `#FFFFFF` | 100% | Headings, important text, titles |
| `text-secondary` | `#A1A1AA` | 100% | Body text, descriptions |
| `text-tertiary` | `#71717A` | 100% | Hints, placeholders, timestamps |
| `text-disabled` | `#52525B` | 100% | Disabled text |
| `text-inverse` | `#000000` | 100% | Text on light backgrounds |

## 1.4 Semantic Colors

| Name | Hex | Light Variant | Usage |
|------|-----|---------------|-------|
| `success` | `#22C55E` | `#22C55E1A` (10%) | Completed tasks, positive feedback |
| `warning` | `#EAB308` | `#EAB3081A` (10%) | Attention needed, due soon |
| `error` | `#EF4444` | `#EF44441A` (10%) | Errors, delete actions, overdue |
| `info` | `#3B82F6` | `#3B82F61A` (10%) | Information, tips |

## 1.5 Gradient Definitions

### Orb Gradient (Primary)
```css
background: conic-gradient(
  from 180deg at 50% 50%,
  #7C3AED 0deg,
  #A78BFA 120deg,
  #C4B5FD 180deg,
  #A78BFA 240deg,
  #7C3AED 360deg
);
```

### Button Gradient
```css
background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%);
```

### Card Highlight Gradient
```css
background: linear-gradient(
  180deg,
  rgba(124, 58, 237, 0.08) 0%,
  rgba(124, 58, 237, 0) 100%
);
```

### Orb Glow
```css
box-shadow: 
  0 0 60px rgba(124, 58, 237, 0.4),
  0 0 120px rgba(124, 58, 237, 0.2),
  0 0 180px rgba(124, 58, 237, 0.1);
```

---

# SECTION 2: TYPOGRAPHY SPECIFICATION

## 2.1 Font Family

```
Primary: SF Pro Display
Fallback: -apple-system, BlinkMacSystemFont, system-ui
Mono: SF Mono (for timers, numbers)
```

## 2.2 Type Scale (Exact)

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| `display-large` | 48px | 700 | 56px | -1.5px | Timer digits only |
| `display` | 34px | 700 | 40px | -0.5px | Screen titles (rare) |
| `title-1` | 28px | 700 | 34px | -0.3px | Section headers |
| `title-2` | 22px | 600 | 28px | -0.2px | Card titles, modal headers |
| `title-3` | 20px | 600 | 24px | -0.1px | Subsection headers |
| `headline` | 17px | 600 | 22px | -0.4px | Important labels, buttons |
| `body` | 17px | 400 | 24px | -0.4px | Main body text |
| `body-medium` | 17px | 500 | 24px | -0.4px | Emphasized body |
| `callout` | 16px | 400 | 21px | -0.3px | Secondary text |
| `subhead` | 15px | 400 | 20px | -0.2px | Metadata, subtitles |
| `footnote` | 13px | 400 | 18px | -0.1px | Timestamps, hints |
| `caption-1` | 12px | 500 | 16px | 0px | Labels, badges |
| `caption-2` | 11px | 400 | 13px | 0.1px | Tiny labels |

## 2.3 Typography by Screen Element

### AI Home Screen
```
Greeting "Good morning, Alex": title-1, text-primary
AI Message "How can I help?": body, text-secondary
Quick Action Button: headline, text-primary
Stats Card Number: title-2, text-primary
Stats Card Label: caption-1, text-tertiary
Swipe Hint: footnote, text-tertiary
```

### Tasks Screen
```
Screen Title "Tasks": title-1, text-primary
Filter Tab Active: headline, text-primary
Filter Tab Inactive: headline, text-tertiary
Section Header "MORNING": caption-1, text-tertiary, uppercase, letter-spacing 1px
Task Title: body-medium, text-primary
Task Time: subhead, text-tertiary
Task Category Tag: caption-1, text-secondary
AI Duration Estimate: caption-1, brand-secondary
```

### Focus Screen
```
Timer: display-large, text-primary, SF Mono
AI Encouragement: body, text-secondary
Task Label: subhead, text-tertiary
Button Label: headline, text-primary
Session Stats: footnote, text-tertiary
```

### Profile Screen
```
User Name: title-2, text-primary
Streak Badge: caption-1, brand-secondary
Stat Number: title-1, text-primary
Stat Label: caption-1, text-tertiary
Unlock Title: body-medium, text-primary
Unlock Status: subhead, text-secondary
Settings Item: body, text-primary
```

---

# SECTION 3: SPACING SPECIFICATION

## 3.1 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | None |
| `space-1` | 4px | Tight element spacing |
| `space-2` | 8px | Related element gaps |
| `space-3` | 12px | Component internal padding |
| `space-4` | 16px | Card padding, list item padding |
| `space-5` | 20px | Screen horizontal margin |
| `space-6` | 24px | Section gaps |
| `space-7` | 32px | Major section spacing |
| `space-8` | 40px | Screen top padding (below safe area) |
| `space-9` | 48px | Hero spacing |
| `space-10` | 64px | Large gaps |

## 3.2 Screen Layout

```
Safe Area Top: 59px (iPhone 15 Pro) / 47px (iPhone SE)
Safe Area Bottom: 34px (home indicator) / 0px (iPhone SE)

Screen Horizontal Padding: 20px
Screen Top Padding (below safe area): 16px
Screen Bottom Padding (above safe area): 24px

Content Max Width: 100% (no max on mobile)
```

## 3.3 Component Spacing

### Card Spacing
```
Card Margin (between cards): 12px
Card Padding: 16px
Card Inner Element Gap: 12px
Card Title to Content: 8px
```

### List Spacing
```
List Item Height (single line): 56px
List Item Height (two line): 72px
List Item Horizontal Padding: 16px
List Item Vertical Padding: 12px
List Separator Inset: 16px from left
List Section Header Margin Top: 24px
List Section Header Margin Bottom: 8px
```

### Button Spacing
```
Button Padding (large): 16px 32px
Button Padding (medium): 12px 24px
Button Padding (small): 8px 16px
Button Gap (between buttons): 12px
Button Icon Gap: 8px
```

---

# SECTION 4: BORDER RADIUS SPECIFICATION

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | 0px | Sharp corners |
| `radius-sm` | 6px | Small tags, badges |
| `radius-md` | 10px | Buttons, inputs |
| `radius-lg` | 14px | Cards, list items |
| `radius-xl` | 20px | Modals, large cards |
| `radius-2xl` | 28px | Bottom sheets |
| `radius-full` | 9999px | Pills, circular buttons, orb |

---

# SECTION 5: SHADOW SPECIFICATION

## 5.1 Elevation Shadows

```css
/* No shadow - flat design mostly */
shadow-none: none;

/* Subtle lift */
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);

/* Card elevation */
shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);

/* Modal elevation */
shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.5);

/* Floating elements */
shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.6);
```

## 5.2 Glow Shadows (for brand elements)

```css
/* Button glow */
glow-button: 0 4px 14px rgba(124, 58, 237, 0.4);

/* Orb glow - idle */
glow-orb-idle: 
  0 0 40px rgba(124, 58, 237, 0.3),
  0 0 80px rgba(124, 58, 237, 0.15);

/* Orb glow - active */
glow-orb-active:
  0 0 60px rgba(124, 58, 237, 0.5),
  0 0 120px rgba(124, 58, 237, 0.3),
  0 0 180px rgba(124, 58, 237, 0.15);

/* Success glow */
glow-success: 0 0 20px rgba(34, 197, 94, 0.4);
```

---

# SECTION 6: COMPONENT SPECIFICATIONS

## 6.1 AI Orb Component

### Large Orb (AI Home)
```
Diameter: 160px
Border Radius: 80px (full circle)

Structure (layers from outside to inside):
1. Outer Glow Layer: 200px diameter, blur 60px, brand-primary at 20% opacity
2. Middle Ring: 168px diameter, 2px border, brand-tertiary at 30% opacity
3. Main Orb: 160px diameter, conic gradient fill
4. Inner Core: 80px diameter, brand-primary solid, blur 20px
5. Highlight Spot: 24px diameter, white at 40%, positioned top-left

Animation (idle):
- Scale: 1.0 → 1.03 → 1.0
- Duration: 4000ms
- Easing: ease-in-out
- Loop: infinite

Animation (listening):
- Scale: 1.0 → 1.08 → 1.0
- Duration: 800ms
- Glow opacity: 0.3 → 0.6 → 0.3
- Sound waves: 3 rings expanding from center every 400ms
```

### Mini Orb (Other Screens)
```
Diameter: 44px
Border Radius: 22px

Structure:
1. Glow: 52px diameter, brand-primary at 15%
2. Main Circle: 44px diameter, gradient fill
3. Inner Highlight: 8px diameter, white at 30%

Touch Target: 44px × 44px minimum
Position: Top right, 20px from edges
```

### Orb Design Prompt (Figma/AI)
```
Create an AI orb component for a voice assistant app.

LARGE VERSION (160px):
- Outer glow: Soft purple haze extending 20px beyond orb
- Main body: Conic gradient rotating through purple spectrum
  Colors: #7C3AED → #A78BFA → #C4B5FD → #A78BFA → #7C3AED
- Inner core: Solid #7C3AED with 20px blur
- Top-left highlight: Small white dot (24px) at 40% opacity
- Subtle rotating animation implied

MINI VERSION (44px):
- Simplified: Just gradient fill with small glow
- Same color scheme, less detail

States to show:
1. Idle: Calm, gentle glow
2. Listening: Brighter glow, implied pulsing
3. Processing: Gradient appears to rotate faster
4. Speaking: Rhythmic pulse visualization

Background: Pure black #000000
Style: Magical, alive, approachable
```

---

## 6.2 Task Card Component

### Dimensions
```
Width: 100% - 40px (20px margin each side)
Min Height: 72px
Padding: 16px
Border Radius: 14px
Background: #161616
```

### Layout
```
┌────────────────────────────────────────────────────┐
│ 16px padding                                       │
│  ┌──────┐                                          │
│  │  ○   │ 12px  Task Title Here                   │
│  │ 24px │  gap  9:00 AM · Work · ~25 min          │
│  └──────┘                                          │
│ 16px padding                                       │
└────────────────────────────────────────────────────┘

Checkbox: 24px × 24px
Checkbox Border: 2px, #52525B
Checkbox Checked: Fill #22C55E, checkmark #000000

Title: body-medium (17px/500), #FFFFFF
Metadata Line: subhead (15px/400), #71717A
Category Tag: caption-1 (12px/500), #A1A1AA, background #2C2C2E, padding 4px 8px, radius 6px
Duration Estimate: caption-1, #A78BFA
```

### States
```
Default:
- Background: #161616
- No border

Pressed:
- Background: #1C1C1E
- Scale: 0.98

Completed:
- Title: strikethrough, #71717A
- Checkbox: filled green with checkmark
- Background: #161616 (same)

Overdue:
- Left border: 3px solid #EF4444
- Time text: #EF4444

AI Suggested:
- Left border: 3px solid #7C3AED
- Small "AI" badge top right
```

### Swipe Actions
```
Swipe Left Reveals (from right):
- Complete: Green (#22C55E) background, checkmark icon
- Delete: Red (#EF4444) background, trash icon
- Action width: 80px each

Swipe Right Reveals (from left):
- Defer: Orange (#EAB308) background, arrow-right icon
- Action width: 80px
```

### Task Card Design Prompt
```
Design a task card component for a dark productivity app.

SPECIFICATIONS:
- Width: Full width minus 40px margins
- Height: Auto, minimum 72px
- Background: #161616
- Border radius: 14px
- Padding: 16px all sides

LAYOUT (left to right):
1. Checkbox (24×24px):
   - Unchecked: 2px border #52525B, transparent fill
   - Checked: Solid #22C55E fill, black checkmark
   
2. Content (12px gap from checkbox):
   - Title: 17px semibold white
   - Metadata: 15px regular #71717A
   - Format: "9:00 AM · Category · ~25 min"
   - Category is a small tag with #2C2C2E background

STATES TO SHOW:
1. Default task
2. Completed (strikethrough title, green checkbox)
3. Overdue (red left border, red time)
4. AI suggested (purple left border, "AI" badge)
5. Pressed (darker background, slight scale down)

SWIPE PREVIEW:
- Show card mid-swipe revealing green "Complete" action

Background: Pure black
Style: Clean, scannable, minimal
```

---

## 6.3 Stats Card Component

### Dimensions
```
Width: Flexible, typically 25% of screen - gaps (for 4-column grid)
       Or 80px fixed width
Height: 80px
Padding: 12px
Border Radius: 14px
Background: #161616
```

### Layout
```
┌─────────────┐
│    156      │  Number: title-1 (28px/700), centered, #FFFFFF
│   tasks     │  Label: caption-1 (12px/500), centered, #71717A
└─────────────┘
```

### Variants
```
Standard:
- Background: #161616
- Number + Label

With Icon:
- Small icon (16px) top-left corner
- Icon color: brand-secondary

Highlighted:
- Background: linear-gradient(180deg, rgba(124,58,237,0.1) 0%, #161616 100%)
- Subtle purple top glow

With Trend:
- Small arrow icon next to number
- Green arrow up = positive
- Red arrow down = negative
```

### Stats Card Design Prompt
```
Design a stats card component for a productivity app.

SPECIFICATIONS:
- Size: 80px × 80px (square) or flexible width
- Background: #161616
- Border radius: 14px
- Padding: 12px

CONTENT (vertically centered):
- Number: 28px bold white, centered
- Label: 12px medium #71717A, centered, below number

VARIANTS:
1. Basic: Just number + label (e.g., "156" / "tasks")
2. With icon: 16px icon in top-left (#A78BFA tint)
3. Highlighted: Subtle purple gradient at top
4. With trend: Small up/down arrow next to number

EXAMPLE VALUES:
- "156 tasks" (with checkmark icon)
- "42h focus" (with timer icon)
- "47 days" (with flame icon, highlighted)
- "2.4k XP" (with star icon)

Background: Black
Style: Compact, glanceable, premium
```

---

## 6.4 Button Components

### Primary Button
```
Height: 56px
Padding: 16px 32px
Border Radius: 14px
Background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)
Shadow: 0 4px 14px rgba(124, 58, 237, 0.4)

Text: headline (17px/600), #FFFFFF, centered
Icon (optional): 20px, #FFFFFF, 8px gap from text

States:
- Default: As above
- Pressed: Scale 0.97, shadow reduced
- Disabled: Opacity 0.5, no shadow
- Loading: Spinner replaces text
```

### Secondary Button
```
Height: 56px
Padding: 16px 32px
Border Radius: 14px
Background: #1C1C1E
Border: 1px solid #3F3F46

Text: headline (17px/600), #FFFFFF

States:
- Default: As above
- Pressed: Background #2C2C2E
- Disabled: Opacity 0.5
```

### Ghost Button
```
Height: 48px
Padding: 12px 24px
Border Radius: 10px
Background: transparent

Text: headline (17px/600), #A78BFA

States:
- Default: As above
- Pressed: Background rgba(124, 58, 237, 0.1)
- Disabled: Text opacity 0.5
```

### Icon Button
```
Size: 44px × 44px
Border Radius: 22px (circle)
Background: #1C1C1E
Icon: 24px, #FFFFFF

States:
- Default: As above
- Pressed: Background #2C2C2E
- Active: Background #7C3AED, icon #FFFFFF
```

### Small Button (Tags, Actions)
```
Height: 32px
Padding: 8px 16px
Border Radius: 8px
Background: #1C1C1E

Text: caption-1 (12px/500), #A1A1AA

States:
- Default: As above
- Selected: Background #7C3AED, text #FFFFFF
```

### Button Design Prompt
```
Design a button system for a dark premium app.

PRIMARY BUTTON:
- Height: 56px
- Background: Purple gradient (#7C3AED to #9333EA)
- Text: 17px semibold white
- Border radius: 14px
- Shadow: Purple glow underneath
- Pressed: Slight scale down (0.97)

SECONDARY BUTTON:
- Height: 56px
- Background: #1C1C1E
- Border: 1px solid #3F3F46
- Text: 17px semibold white
- Pressed: Darker background

GHOST BUTTON:
- Height: 48px
- Background: Transparent
- Text: 17px semibold purple (#A78BFA)
- Pressed: Subtle purple background tint

ICON BUTTON:
- Size: 44×44px (circular)
- Background: #1C1C1E
- Icon: 24px white
- Active state: Purple background

Show all buttons in:
- Default state
- Pressed state
- Disabled state (50% opacity)

Background: Black
```

---

## 6.5 Input Field Component

### Text Input
```
Height: 56px
Padding: 16px
Border Radius: 12px
Background: #161616
Border: 1px solid #3F3F46

Text: body (17px/400), #FFFFFF
Placeholder: body (17px/400), #52525B

States:
- Default: Border #3F3F46
- Focused: Border #7C3AED, glow 0 0 0 3px rgba(124,58,237,0.2)
- Error: Border #EF4444, error message below
- Disabled: Opacity 0.5
```

### Search Input
```
Height: 48px
Padding: 12px 16px 12px 44px (extra left for icon)
Border Radius: 24px (pill shape)
Background: #1C1C1E
Border: none

Search Icon: 20px, #71717A, positioned 12px from left
Clear Button: 20px, #71717A, appears when has value
Placeholder: "Search..." in #52525B
```

### Input Field Design Prompt
```
Design input field components for a dark app.

TEXT INPUT:
- Height: 56px
- Background: #161616
- Border: 1px solid #3F3F46
- Border radius: 12px
- Padding: 16px
- Text: 17px white
- Placeholder: 17px #52525B

States:
1. Default: Gray border
2. Focused: Purple border (#7C3AED) with subtle glow
3. Error: Red border with error message below
4. With value: White text visible

SEARCH INPUT:
- Height: 48px
- Background: #1C1C1E
- Border radius: 24px (pill)
- Search icon on left (gray)
- Clear X button on right (when has text)
- Placeholder: "Search..."

Background: Black
```

---

## 6.6 Filter Tabs Component

### Dimensions
```
Container Height: 44px
Tab Padding: 12px 16px
Tab Border Radius: 22px (pill)
Tab Gap: 8px
```

### States
```
Inactive Tab:
- Background: transparent
- Text: headline (17px/600), #71717A

Active Tab:
- Background: #7C3AED
- Text: headline (17px/600), #FFFFFF

Pressed (inactive):
- Background: rgba(124, 58, 237, 0.1)
```

### Filter Tabs Design Prompt
```
Design horizontal filter tabs for a dark app.

SPECIFICATIONS:
- Container: Full width, horizontal scroll if needed
- Tab shape: Pill (fully rounded)
- Tab padding: 12px horizontal, 8px vertical
- Gap between tabs: 8px

INACTIVE TAB:
- Background: Transparent
- Text: 17px semibold #71717A

ACTIVE TAB:
- Background: #7C3AED (solid purple)
- Text: 17px semibold white

Example tabs: "Today" (active), "Tomorrow", "All", "High Priority"

Background: Black
Style: Clean, touch-friendly
```

---

## 6.7 List Item Component

### Standard List Item
```
Height: 56px
Padding: 16px horizontal
Background: transparent
Separator: 1px solid #1C1C1E, inset 16px from left

Content:
- Left Icon (optional): 24px, #A1A1AA, 12px gap to text
- Title: body (17px/400), #FFFFFF
- Right Chevron: 16px, #52525B
- Right Value (optional): subhead (15px/400), #71717A

Pressed: Background #161616
```

### List Section Header
```
Height: 32px
Padding: 16px horizontal, 8px vertical
Background: transparent

Text: caption-1 (12px/500), #71717A, uppercase, letter-spacing 1px
```

### List Item Design Prompt
```
Design list item components for a dark settings-style list.

STANDARD ITEM:
- Height: 56px
- Padding: 16px horizontal
- Background: Transparent (black shows through)

Content layout:
- Optional icon on left (24px, gray)
- Title in white (17px regular)
- Optional value text on right (15px gray)
- Chevron on far right (16px, dark gray)

Separator: Thin line (#1C1C1E), inset from left

SECTION HEADER:
- Height: 32px
- Text: 12px medium, gray, UPPERCASE
- Letter spacing: 1px

States:
- Default: Transparent background
- Pressed: Dark background (#161616)

Background: Black
```

---

## 6.8 Badge Components

### Count Badge
```
Min Width: 20px
Height: 20px
Padding: 4px 6px
Border Radius: 10px (full)
Background: #EF4444 (notifications) or #7C3AED (count)

Text: caption-2 (11px/400), #FFFFFF, centered
Position: Absolute, top-right of parent, offset -4px
```

### Status Badge
```
Height: 24px
Padding: 4px 10px
Border Radius: 12px
Background: Semantic color at 15% opacity

Text: caption-1 (12px/500), semantic color full

Examples:
- "Active": Background #22C55E26, text #22C55E
- "Due Soon": Background #EAB30826, text #EAB308
- "Overdue": Background #EF444426, text #EF4444
```

### Category Tag
```
Height: 24px
Padding: 4px 10px
Border Radius: 6px
Background: #2C2C2E

Text: caption-1 (12px/500), #A1A1AA
Icon (optional): 12px, before text, 4px gap
```

### Badge Design Prompt
```
Design badge components for a dark app.

COUNT BADGE (for notifications):
- Size: 20px minimum width, 20px height
- Background: Red (#EF4444) or Purple (#7C3AED)
- Text: 11px white, centered
- Shape: Pill/circle
- Position: Top-right corner of parent element

STATUS BADGE:
- Height: 24px
- Padding: 4px 10px
- Border radius: 12px (pill)
- Background: Semantic color at 15% opacity
- Text: 12px semibold in full semantic color

Show: "Active" (green), "Due Soon" (yellow), "Overdue" (red)

CATEGORY TAG:
- Height: 24px
- Padding: 4px 10px
- Background: #2C2C2E
- Border radius: 6px
- Text: 12px gray

Show: "Work", "Personal", "Health" with optional icons

Background: Black
```

---

## 6.9 Modal / Bottom Sheet

### Bottom Sheet
```
Border Radius: 28px (top corners only)
Background: #0D0D0D
Handle: 36px × 4px, #3F3F46, centered, 8px from top

Padding:
- Top: 24px (below handle)
- Horizontal: 20px
- Bottom: 34px + safe area

Shadow: 0 -10px 40px rgba(0, 0, 0, 0.5)
Backdrop: #000000 at 60% opacity
```

### Center Modal
```
Width: 90% of screen, max 340px
Border Radius: 24px
Background: #161616
Padding: 24px

Shadow: 0 20px 60px rgba(0, 0, 0, 0.6)
Backdrop: #000000 at 70% opacity
```

### Modal Design Prompt
```
Design modal components for a dark app.

BOTTOM SHEET:
- Slides up from bottom
- Background: #0D0D0D
- Top corners: 28px radius
- Drag handle: 36×4px gray bar, centered at top
- Padding: 24px top, 20px sides, 34px bottom (+ safe area)
- Backdrop: Black at 60% opacity

CENTER MODAL:
- Centered on screen
- Background: #161616
- Border radius: 24px
- Padding: 24px
- Max width: 340px
- Backdrop: Black at 70% opacity

Show example:
- Celebration modal with icon, title, description, button

Background: Black
```

---

## 6.10 Progress Bar

### Standard Progress Bar
```
Height: 8px
Border Radius: 4px
Background (track): #1C1C1E
Background (fill): linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%)
```

### Thin Progress Bar
```
Height: 4px
Border Radius: 2px
Same colors as standard
```

### Progress Bar Design Prompt
```
Design progress bar components.

STANDARD (8px height):
- Track: #1C1C1E
- Fill: Purple gradient (#7C3AED to #A78BFA)
- Border radius: 4px

THIN (4px height):
- Same colors, smaller size

Show at: 0%, 33%, 66%, 100% fill states

Optional: Animated shimmer effect on fill
```

---

# SECTION 7: SCREEN DESIGNS (DETAILED)

## 7.1 AI Home Screen

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│ Safe Area Top (59px)                │
├─────────────────────────────────────┤
│ 16px                                │
│                                     │
│ ← Tasks (left edge hint)            │ Hint: footnote, #52525B, 20px from edge
│                Focus ↑ (top hint)   │
│                                     │
│ 48px                                │
│                                     │
│     "Good morning, Alex"            │ title-1 (28px/700), #FFFFFF, centered
│                                     │
│ 32px                                │
│                                     │
│            ┌───────┐                │
│            │       │                │
│            │  ORB  │                │ 160px × 160px, centered
│            │       │                │
│            └───────┘                │
│                                     │
│ 24px                                │
│                                     │
│    "How can I help you today?"      │ body (17px/400), #A1A1AA, centered
│                                     │
│ 32px                                │
│                                     │
│   ┌──────────┐  12px  ┌──────────┐ │ Buttons: 120px wide each
│   │ ▶ Focus  │        │ + Task   │ │ Secondary style
│   └──────────┘        └──────────┘ │
│                                     │
│ 32px                                │
│                                     │
│   ┌────┐ 12px ┌────┐ 12px ┌────┐   │ Stats cards: 80px each
│   │ 5  │      │🔥47│      │ #2 │   │
│   │task│      │days│      │rank│   │
│   └────┘      └────┘      └────┘   │
│                                     │
│ 24px                                │
│                                     │
│ → Social (right edge hint)          │
│                Profile ↓ (bottom)   │
│                                     │
├─────────────────────────────────────┤
│ Safe Area Bottom (34px)             │
└─────────────────────────────────────┘
```

### AI Home Design Prompt
```
Design the AI Home screen for MYPA app - exact specifications.

CANVAS: iPhone 15 Pro (393 × 852px), include safe areas
BACKGROUND: #000000

LAYOUT (from top):

1. NAVIGATION HINTS (optional, fade out after 3s):
   - "← Tasks" left edge, 20px from edge, vertically centered-left
   - "Focus ↑" top center, 80px from top
   - "Social →" right edge, 20px from edge
   - "↓ Profile" bottom center, 80px from bottom
   - All hints: 13px regular #52525B

2. GREETING (48px below safe area):
   - "Good morning, Alex"
   - 28px bold white, centered
   - Dynamic: morning/afternoon/evening

3. AI ORB (32px below greeting):
   - 160×160px centered
   - Conic gradient: #7C3AED → #A78BFA → #C4B5FD → #A78BFA → #7C3AED
   - Outer glow: 60px blur, #7C3AED at 30%
   - Inner highlight: 24px white dot top-left at 40%

4. AI MESSAGE (24px below orb):
   - "How can I help you today?"
   - 17px regular #A1A1AA, centered

5. QUICK ACTIONS (32px below message):
   - Two buttons side by side, 12px gap
   - Button size: 120×48px each
   - Style: Secondary (dark background, gray border)
   - Left: "▶ Focus" (play icon + text)
   - Right: "+ Task" (plus icon + text)
   - Centered as a group

6. STATS CARDS (32px below buttons):
   - Three cards, 12px gaps
   - Card size: 80×80px
   - Background: #161616
   - Radius: 14px
   - Content:
     - "5" / "tasks" (checkmark icon)
     - "47" / "days" (flame icon, highlighted purple glow)
     - "#2" / "rank" (trophy icon)
   - Numbers: 22px bold white
   - Labels: 12px medium #71717A

7. SAFE AREA BOTTOM: 34px clear

Total interaction: Tap orb to speak, tap buttons for actions, swipe edges to navigate
```

---

## 7.2 Tasks Screen

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│ Safe Area Top                       │
├─────────────────────────────────────┤
│ 20px │ Tasks                   ◉ │ 20px
│      │                              │
│ Header: title-1 left, mini orb right│
├─────────────────────────────────────┤
│ 16px                                │
│ ┌─────────────────────────────────┐ │
│ │ Today | Tomorrow | All | High  │ │ Filter tabs
│ └─────────────────────────────────┘ │
│ 24px                                │
│ MORNING                             │ Section header
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ ○  Review project brief         │ │ Task card 1
│ │    9:00 AM · Work               │ │
│ └─────────────────────────────────┘ │
│ 12px                                │
│ ┌─────────────────────────────────┐ │
│ │ ○  Team standup call            │ │ Task card 2
│ │    10:00 AM · Work              │ │
│ └─────────────────────────────────┘ │
│ 24px                                │
│ AFTERNOON                           │
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ ○  Gym session                  │ │ Task card 3
│ │    2:00 PM · Health  ~45 min    │ │
│ └─────────────────────────────────┘ │
│                                     │
│                              ┌───┐  │
│                              │ + │  │ FAB
│                              └───┘  │
├─────────────────────────────────────┤
│ Safe Area Bottom                    │
└─────────────────────────────────────┘
```

### Tasks Screen Design Prompt
```
Design the Tasks screen for MYPA app - exact specifications.

CANVAS: iPhone 15 Pro (393 × 852px)
BACKGROUND: #000000

HEADER (below safe area):
- Height: 56px
- Padding: 20px horizontal
- Left: "Tasks" - 28px bold white
- Right: Mini AI orb (44px), tap to voice command

FILTER TABS (16px below header):
- Horizontal scroll container
- Padding: 0 20px
- Tabs: "Today" (active), "Tomorrow", "All", "High Priority"
- Active: #7C3AED background, white text, pill shape
- Inactive: Transparent, #71717A text
- Tab padding: 12px 16px
- Tab gap: 8px

SECTION HEADERS:
- "MORNING", "AFTERNOON", "EVENING"
- 12px medium, #71717A, uppercase
- Letter spacing: 1px
- Margin: 24px top, 8px bottom
- Padding: 0 20px

TASK CARDS:
- Width: Full width - 40px (20px margins)
- Background: #161616
- Radius: 14px
- Padding: 16px
- Gap between cards: 12px

Card content:
- Checkbox: 24×24px, 2px border #52525B, 12px gap to text
- Title: 17px medium white
- Metadata: 15px regular #71717A
- Category tag: 12px, #2C2C2E background, 6px radius
- AI estimate: 12px #A78BFA (e.g., "~45 min")

Card states:
- Show one completed (strikethrough, green checkbox)
- Show one with purple left border (AI suggested)

FAB (Floating Action Button):
- Size: 56×56px
- Position: Bottom right, 20px from edges, above safe area
- Background: Purple gradient
- Icon: Plus, 24px white
- Shadow: Purple glow

Show swipe action preview on one card (green complete action revealed)
```

---

## 7.3 Focus Screen (Modal)

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│                                     │
│          ────────                   │ Drag handle: 36×4px, #3F3F46
│                                     │
│ 48px                                │
│                                     │
│             25:00                   │ Timer: display-large (48px), SF Mono
│                                     │
│ 40px                                │
│                                     │
│            ┌───────┐                │
│            │  ORB  │                │ 120px orb (medium)
│            └───────┘                │
│                                     │
│ 32px                                │
│                                     │
│     "Stay focused, you're          │ body (17px), #A1A1AA, centered
│         doing great"               │ Max width: 280px
│                                     │
│ 24px                                │
│                                     │
│   Working on: Project Brief         │ subhead (15px), #71717A
│                                     │
│ 48px                                │
│                                     │
│   ┌──────────┐    ┌──────────┐     │
│   │  Pause   │    │   End    │     │
│   └──────────┘    └──────────┘     │
│                                     │
│ 24px                                │
│                                     │
│      18:32 elapsed · +25 XP         │ footnote (13px), #52525B
│                                     │
├─────────────────────────────────────┤
│ Safe Area Bottom                    │
└─────────────────────────────────────┘
```

### Focus Screen Design Prompt
```
Design the Focus Timer modal for MYPA app - exact specifications.

PRESENTATION: Bottom sheet, 90% screen height
BACKGROUND: #0D0D0D
TOP CORNERS: 28px radius

DRAG HANDLE:
- 36×4px, #3F3F46, centered
- 12px from top

TIMER (48px below handle):
- "25:00" format
- Font: SF Mono, 48px bold white
- Centered
- Subtle pulsing glow when active

AI ORB (40px below timer):
- 120×120px (medium size)
- Same gradient as main orb
- Gentler animation during focus
- Centered

AI MESSAGE (32px below orb):
- Encouraging text, changes every few minutes
- Examples: "Stay focused, you're doing great", "Almost there!", "Deep work mode"
- 17px regular #A1A1AA
- Centered, max width 280px

TASK LABEL (24px below message):
- "Working on: [Task Name]"
- Or "General focus session" if no task
- 15px regular #71717A
- Centered

CONTROL BUTTONS (48px below task):
- Two buttons side by side, 16px gap
- Width: 140px each
- "Pause": Secondary style (dark bg, border)
- "End Session": Ghost style (outline, no fill)
- Centered as group

SESSION STATS (24px below buttons):
- "18:32 elapsed · +25 XP"
- 13px regular #52525B
- Centered

BACKDROP: Black at 60% opacity over previous screen
```

---

## 7.4 Unlock Celebration Modal

### Exact Layout
```
┌─────────────────────────────────────┐
│                                     │
│           ✨ 🎊 ✨                   │ Confetti animation
│                                     │
│            ┌─────┐                  │
│            │  ⚡  │                 │ Icon: 48px, in 80px circle
│            └─────┘                  │ Circle: #7C3AED20 bg, purple glow
│                                     │
│        New AI Ability!              │ title-2 (22px), white
│                                     │
│        Peak Hours                   │ title-3 (20px), #A78BFA
│          Detection                  │
│                                     │
│   "I now know when you're most     │ body (17px), #A1A1AA
│    productive. I'll suggest your   │ Max width: 280px, centered
│    important tasks during your     │
│    peak focus hours."              │
│                                     │
│         ┌────────────────┐         │
│         │    Awesome!    │         │ Primary button, full width - 48px
│         └────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

### Unlock Celebration Design Prompt
```
Design the Unlock Celebration modal for MYPA - exact specifications.

MODAL TYPE: Center modal
SIZE: 320px wide, auto height
BACKGROUND: #161616
RADIUS: 24px
PADDING: 32px

CONFETTI:
- Particle animation at top
- Colors: #7C3AED, #A78BFA, #EAB308, #FFFFFF
- 50-80 particles falling
- Duration: 3 seconds

ICON CONTAINER:
- 80×80px circle
- Background: #7C3AED at 20%
- Icon: 48px, white (use bolt/lightning for this unlock)
- Subtle purple glow around circle
- Centered

TITLE (16px below icon):
- "New AI Ability!"
- 22px semibold white
- Centered

FEATURE NAME (8px below title):
- "Peak Hours Detection"
- 20px semibold #A78BFA
- Centered

DESCRIPTION (16px below name):
- AI explanation in first person
- 17px regular #A1A1AA
- Max width: 280px
- Centered, multi-line

BUTTON (24px below description):
- "Awesome!"
- Primary style (purple gradient)
- Full width minus 48px padding
- Height: 56px

BACKDROP: Black at 70%

Animation sequence:
1. Modal scales up from 0.8 to 1.0 (200ms)
2. Confetti starts
3. Icon pulses once
4. Text fades in sequentially (100ms each)
```

---

# SECTION 8: ICONOGRAPHY

## 8.1 SF Symbols Mapping

### Navigation Icons
```
Tasks view:      checklist (filled when active)
Social view:     person.2.fill
Profile view:    person.circle.fill
Focus view:      timer
AI Home:         sparkles
```

### Action Icons
```
Add/Create:      plus
Complete:        checkmark
Delete:          trash
Edit:            pencil
Share:           square.and.arrow.up
Close:           xmark
Back:            chevron.left
Forward:         chevron.right
More:            ellipsis
Settings:        gearshape.fill
```

### Status Icons
```
Streak/Fire:     flame.fill
XP/Star:         star.fill
Trophy:          trophy.fill
Lock:            lock.fill
Unlock:          lock.open.fill
Clock:           clock.fill
Calendar:        calendar
Notification:    bell.fill
```

### Voice Icons
```
Microphone:      mic.fill
Listening:       waveform
Speaker:         speaker.wave.2.fill
Mute:            speaker.slash.fill
```

## 8.2 Icon Sizes

```
Navigation bar:   24px, 2px stroke
In buttons:       20px
In list items:    24px
Tab bar:          28px
Feature icons:    32px
Hero icons:       48px
```

## 8.3 Icon Colors

```
Default:          #A1A1AA (text-secondary)
Active:           #FFFFFF
Brand:            #A78BFA (brand-secondary)
Disabled:         #52525B
Success:          #22C55E
Warning:          #EAB308
Error:            #EF4444
```

---

# SECTION 9: ANIMATION SPECIFICATIONS

## 9.1 Timing Functions

```javascript
// Standard ease
ease: 'cubic-bezier(0.4, 0, 0.2, 1)'

// Ease in (acceleration)
easeIn: 'cubic-bezier(0.4, 0, 1, 1)'

// Ease out (deceleration)
easeOut: 'cubic-bezier(0, 0, 0.2, 1)'

// Spring (for gestures)
spring: {
  damping: 20,
  stiffness: 200,
  mass: 1
}

// Bounce (for celebrations)
bounce: {
  damping: 10,
  stiffness: 400,
  mass: 0.5
}
```

## 9.2 Duration Scale

```
instant:    0ms    (color changes)
fast:       100ms  (micro-interactions)
normal:     200ms  (standard transitions)
slow:       300ms  (complex transitions)
slower:     500ms  (entrance animations)
slowest:    1000ms (dramatic effects)
```

## 9.3 Specific Animations

### Button Press
```javascript
{
  scale: [1, 0.97, 1],
  duration: 150,
  easing: 'ease-out'
}
```

### Card Appear (staggered list)
```javascript
{
  opacity: [0, 1],
  translateY: [20, 0],
  duration: 200,
  delay: index * 50,
  easing: 'ease-out'
}
```

### Screen Swipe Transition
```javascript
{
  translateX: [fromX, toX],
  spring: { damping: 20, stiffness: 200 }
}
// Peek: show 15% of target screen at swipe start
// Threshold: 100px to complete transition
```

### Orb Idle Pulse
```javascript
{
  scale: [1, 1.03, 1],
  opacity: [0.8, 1, 0.8], // glow
  duration: 4000,
  easing: 'ease-in-out',
  loop: true
}
```

### Orb Listening Pulse
```javascript
{
  scale: [1, 1.08, 1],
  duration: 800,
  easing: 'ease-in-out',
  loop: true
}
// Plus: sound wave rings every 400ms
```

### Confetti Particle
```javascript
{
  translateY: [0, screenHeight + 100],
  translateX: randomRange(-50, 50),
  rotate: randomRange(0, 720),
  scale: [1, 0],
  duration: randomRange(2000, 3000),
  easing: 'ease-in'
}
```

### Success Checkmark Draw
```javascript
{
  pathLength: [0, 1],
  duration: 300,
  easing: 'ease-out'
}
// Then: scale bounce [0, 1.2, 1] over 200ms
```

### Modal Entrance
```javascript
{
  scale: [0.9, 1],
  opacity: [0, 1],
  duration: 200,
  easing: 'ease-out'
}
```

### Toast Notification
```javascript
// Enter from top
{
  translateY: [-100, 0],
  opacity: [0, 1],
  duration: 300,
  easing: 'spring'
}
// Auto dismiss after 3s
{
  translateY: [0, -100],
  opacity: [1, 0],
  duration: 200,
  easing: 'ease-in'
}
```

---

# SECTION 10: DESIGN TOKENS EXPORT

## 10.1 JSON Export (for React Native)

```json
{
  "colors": {
    "background": {
      "primary": "#000000",
      "surface1": "#0D0D0D",
      "surface2": "#161616",
      "surface3": "#1C1C1E",
      "surface4": "#2C2C2E"
    },
    "brand": {
      "primary": "#7C3AED",
      "secondary": "#A78BFA",
      "tertiary": "#C4B5FD",
      "muted": "#4C1D95"
    },
    "text": {
      "primary": "#FFFFFF",
      "secondary": "#A1A1AA",
      "tertiary": "#71717A",
      "disabled": "#52525B"
    },
    "semantic": {
      "success": "#22C55E",
      "successMuted": "#22C55E1A",
      "warning": "#EAB308",
      "warningMuted": "#EAB3081A",
      "error": "#EF4444",
      "errorMuted": "#EF44441A",
      "info": "#3B82F6"
    }
  },
  "spacing": {
    "0": 0,
    "1": 4,
    "2": 8,
    "3": 12,
    "4": 16,
    "5": 20,
    "6": 24,
    "7": 32,
    "8": 40,
    "9": 48,
    "10": 64
  },
  "borderRadius": {
    "none": 0,
    "sm": 6,
    "md": 10,
    "lg": 14,
    "xl": 20,
    "2xl": 28,
    "full": 9999
  },
  "typography": {
    "displayLarge": {
      "fontSize": 48,
      "fontWeight": "700",
      "lineHeight": 56,
      "letterSpacing": -1.5
    },
    "display": {
      "fontSize": 34,
      "fontWeight": "700",
      "lineHeight": 40,
      "letterSpacing": -0.5
    },
    "title1": {
      "fontSize": 28,
      "fontWeight": "700",
      "lineHeight": 34,
      "letterSpacing": -0.3
    },
    "title2": {
      "fontSize": 22,
      "fontWeight": "600",
      "lineHeight": 28,
      "letterSpacing": -0.2
    },
    "title3": {
      "fontSize": 20,
      "fontWeight": "600",
      "lineHeight": 24,
      "letterSpacing": -0.1
    },
    "headline": {
      "fontSize": 17,
      "fontWeight": "600",
      "lineHeight": 22,
      "letterSpacing": -0.4
    },
    "body": {
      "fontSize": 17,
      "fontWeight": "400",
      "lineHeight": 24,
      "letterSpacing": -0.4
    },
    "bodyMedium": {
      "fontSize": 17,
      "fontWeight": "500",
      "lineHeight": 24,
      "letterSpacing": -0.4
    },
    "callout": {
      "fontSize": 16,
      "fontWeight": "400",
      "lineHeight": 21,
      "letterSpacing": -0.3
    },
    "subhead": {
      "fontSize": 15,
      "fontWeight": "400",
      "lineHeight": 20,
      "letterSpacing": -0.2
    },
    "footnote": {
      "fontSize": 13,
      "fontWeight": "400",
      "lineHeight": 18,
      "letterSpacing": -0.1
    },
    "caption1": {
      "fontSize": 12,
      "fontWeight": "500",
      "lineHeight": 16,
      "letterSpacing": 0
    },
    "caption2": {
      "fontSize": 11,
      "fontWeight": "400",
      "lineHeight": 13,
      "letterSpacing": 0.1
    }
  },
  "shadows": {
    "sm": {
      "shadowColor": "#000000",
      "shadowOffset": { "width": 0, "height": 1 },
      "shadowOpacity": 0.5,
      "shadowRadius": 2
    },
    "md": {
      "shadowColor": "#000000",
      "shadowOffset": { "width": 0, "height": 4 },
      "shadowOpacity": 0.4,
      "shadowRadius": 6
    },
    "lg": {
      "shadowColor": "#000000",
      "shadowOffset": { "width": 0, "height": 10 },
      "shadowOpacity": 0.5,
      "shadowRadius": 25
    },
    "glow": {
      "shadowColor": "#7C3AED",
      "shadowOffset": { "width": 0, "height": 4 },
      "shadowOpacity": 0.4,
      "shadowRadius": 14
    }
  },
  "animation": {
    "duration": {
      "instant": 0,
      "fast": 100,
      "normal": 200,
      "slow": 300,
      "slower": 500
    },
    "spring": {
      "default": { "damping": 20, "stiffness": 200, "mass": 1 },
      "bounce": { "damping": 10, "stiffness": 400, "mass": 0.5 }
    }
  }
}
```

## 10.2 CSS Variables Export

```css
:root {
  /* Background */
  --bg-primary: #000000;
  --bg-surface-1: #0D0D0D;
  --bg-surface-2: #161616;
  --bg-surface-3: #1C1C1E;
  --bg-surface-4: #2C2C2E;
  
  /* Brand */
  --brand-primary: #7C3AED;
  --brand-secondary: #A78BFA;
  --brand-tertiary: #C4B5FD;
  --brand-muted: #4C1D95;
  
  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #A1A1AA;
  --text-tertiary: #71717A;
  --text-disabled: #52525B;
  
  /* Semantic */
  --success: #22C55E;
  --warning: #EAB308;
  --error: #EF4444;
  --info: #3B82F6;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --space-10: 64px;
  
  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-2xl: 28px;
  --radius-full: 9999px;
}
```

---

# SECTION 11: FIGMA SETUP PROMPTS

## 11.1 Create Design System File

```
Prompt for Figma/AI design tool:

Create a Figma design system file for MYPA app with these exact specifications:

PAGE 1: FOUNDATIONS
- Color styles for all colors listed (backgrounds, brand, text, semantic)
- Text styles for all typography levels (display through caption)
- Effect styles for shadows and glows

PAGE 2: COMPONENTS
Create these components with variants:

1. AI Orb
   - Variants: large (160px), medium (120px), mini (44px)
   - States: idle, listening, processing, speaking

2. Buttons
   - Variants: primary, secondary, ghost, icon
   - Sizes: large (56px), medium (48px), small (32px)
   - States: default, pressed, disabled, loading

3. Task Card
   - States: default, completed, overdue, AI-suggested, pressed
   - Include swipe action preview

4. Stats Card
   - Variants: basic, with-icon, highlighted

5. Input Fields
   - Variants: text, search
   - States: default, focused, error, disabled

6. Filter Tabs
   - States: active, inactive, pressed

7. List Item
   - Variants: standard, with-icon, with-chevron
   - States: default, pressed

8. Badges
   - Variants: count, status, category

9. Modal
   - Variants: bottom-sheet, center

10. Progress Bar
    - Variants: standard (8px), thin (4px)

PAGE 3: SCREENS
- AI Home
- Tasks View
- Social View
- Profile View
- Focus Modal
- Unlock Celebration

All on iPhone 15 Pro frames (393 × 852px)
Background: #000000 for all
```

## 11.2 Component-Specific Prompts

### AI Orb Component Prompt
```
Create the AI Orb component for MYPA app.

LARGE VERSION (160×160px):
- Outer glow: 200px wide, #7C3AED at 30% opacity, 60px blur
- Outer ring: 168px, 2px stroke #C4B5FD at 30%
- Main circle: 160px with conic gradient
  Gradient stops: #7C3AED 0°, #A78BFA 120°, #C4B5FD 180°, #A78BFA 240°, #7C3AED 360°
- Inner core: 80px, solid #7C3AED, 20px blur
- Highlight: 24px circle, white at 40%, position top-left (x: 40px, y: 35px from center)

MEDIUM VERSION (120×120px):
- Same structure, scaled proportionally
- Glow: 150px, 40px blur
- Core: 60px

MINI VERSION (44×44px):
- Simplified: Just gradient fill + small glow
- Glow: 52px, 20px blur
- No inner details

STATES:
Show all 4 states for large orb:
1. Idle: As described, subtle scale animation implied
2. Listening: Brighter glow (50%), sound wave rings
3. Processing: Gradient appears rotating, particles around
4. Speaking: Pulse visualization, output waves
```

### Task Card Component Prompt
```
Create the Task Card component for MYPA with exact specs.

DIMENSIONS:
- Width: 353px (full width minus 40px margins)
- Height: auto, min 72px
- Padding: 16px
- Border radius: 14px
- Background: #161616

LAYOUT:
Left section:
- Checkbox: 24×24px
- Border: 2px #52525B
- Border radius: 6px

Content section (12px gap from checkbox):
- Title: "Review project brief"
  Font: 17px/500 #FFFFFF
  
- Metadata row (4px below title):
  "9:00 AM" - 15px/400 #71717A
  " · " - separator
  Category tag: "Work" - 12px/500 #A1A1AA, bg #2C2C2E, padding 4px 8px, radius 6px
  " · " - separator (if AI estimate exists)
  "~30 min" - 12px/500 #A78BFA

VARIANTS:
1. Default (as above)
2. Completed:
   - Checkbox: filled #22C55E, white checkmark
   - Title: strikethrough, color #71717A
3. Overdue:
   - Left border: 3px #EF4444
   - Time text: #EF4444
4. AI Suggested:
   - Left border: 3px #7C3AED
   - Badge: "AI" top-right, 12px #7C3AED on #7C3AED20 bg
5. Pressed:
   - Background: #1C1C1E
   - Scale: 0.98

SWIPE PREVIEW:
Show card shifted 60px left, revealing:
- Green area (#22C55E) with checkmark icon
```

### Button System Prompt
```
Create the Button system for MYPA with exact specs.

PRIMARY BUTTON:
- Height: 56px
- Padding: 16px 32px
- Background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)
- Border radius: 14px
- Shadow: 0 4px 14px #7C3AED66
- Text: 17px/600 #FFFFFF, centered
- Icon (optional): 20px, 8px gap from text

States:
- Default: as above
- Pressed: scale 0.97, shadow reduced to 8px blur
- Disabled: opacity 50%, no shadow
- Loading: spinner icon replacing text

SECONDARY BUTTON:
- Height: 56px
- Padding: 16px 32px
- Background: #1C1C1E
- Border: 1px #3F3F46
- Border radius: 14px
- Text: 17px/600 #FFFFFF

States:
- Pressed: bg #2C2C2E
- Disabled: opacity 50%

GHOST BUTTON:
- Height: 48px
- Padding: 12px 24px
- Background: transparent
- Text: 17px/600 #A78BFA
- Border radius: 10px

States:
- Pressed: bg #7C3AED1A
- Disabled: text opacity 50%

ICON BUTTON:
- Size: 44×44px (circle)
- Background: #1C1C1E
- Icon: 24px #FFFFFF

States:
- Pressed: bg #2C2C2E
- Active: bg #7C3AED

Show all buttons in a grid with all states visible.
```

---

This specification document provides every exact measurement, color, and animation needed to build MYPA's UI pixel-perfect. Use the Figma prompts to generate components, and use the JSON tokens directly in code.
