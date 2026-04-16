# Design System Document: Marine Functionalism

## 1. Overview & Creative North Star
**Creative North Star: "The Absolute Signal"**

In the chaotic environment of a marine vessel—where lighting conditions are volatile and decision-making time is measured in seconds—design must transcend "decoration." This design system is rooted in **Marine Functionalism**. It rejects the aesthetic trends of consumer software (glassmorphism, gradients, soft shadows) in favor of the brutalist clarity found in naval radar systems and government safety placards.

The system breaks the "template" look through **uncompromising flatness** and **intentional asymmetry**. We do not "decorate" a dashboard; we "engineer" an interface. By utilizing a zero-radius philosophy and high-contrast tonal blocks, we ensure that the "Signal" is never lost in the "Noise." This is an editorial approach to safety—treating every data point as a headline and every alert as a command.

---

## 2. Colors
Our palette is a hierarchy of urgency. It is inspired by the ISO 3864 safety standards, optimized for legibility against the glare of the sea.

### Color Roles
*   **Primary (#00450D):** The foundation of "Safe" operations. Used for stable status indicators.
*   **Secondary (#835400):** Advisory status. High visibility without the alarmism of red.
*   **Tertiary (#7C000A):** Critical Danger. Reserved for life-threatening data points.
*   **Cyclone (#7F0000):** A deep, heavy red used exclusively for catastrophic weather events.
*   **Surface Hierarchy:** Utilizes the `surface-container` tokens to create functional zones without using lines.

### The "No-Line" Rule
**Borders are prohibited.** To separate a sidebar from a main viewport, or a card from a list, designers must use background color shifts.
*   *Example:* Place a `surface-container-high` (#E8E8E8) card directly onto a `surface` (#F9F9F9) background. The sharp edge of the color change defines the boundary.

### Surface Hierarchy & Nesting
This system uses **Tonal Layering** to define importance. Treat the UI as a physical control panel:
1.  **Base Layer:** `surface` (#F9F9F9)
2.  **Functional Zones:** `surface-container-low` (#F3F3F3)
3.  **Active Interactive Elements:** `surface-container-highest` (#E2E2E2)
4.  **Priority Modals:** `surface-container-lowest` (#FFFFFF)

### The "Anti-Glass" Rule
Contrary to modern trends, this system **strictly forbids** glassmorphism, background blurs, or gradients. Every pixel must be matte. Gradients suggest depth where there is none; we require absolute, flat certainty.

---

## 3. Typography
We utilize **Public Sans** (as a high-performance alternative to Noto Sans) to maintain a clean, "government-spec" aesthetic that ensures multi-language legibility and extreme readability at a distance.

*   **Display-LG (3.5rem):** For critical numerical data (e.g., Wind Speed, Depth).
*   **Headline-MD (1.75rem):** For section headers. Always bold.
*   **Title-SM (1rem):** For card titles and secondary data labels.
*   **Body-LG (1rem):** The minimum size for any descriptive text (16px equivalent). No text on the dashboard shall be smaller than this for primary reading.
*   **Label-SM (0.6875rem):** Reserved for non-critical metadata (e.g., timestamps).

**Typography as Brand:** The hierarchy is "Bold-First." Use weight—not just size—to dictate the order in which information is consumed. In a crisis, the boldest text should tell the operator exactly what is happening.

---

## 4. Elevation & Depth
In this design system, "Elevation" is a misnomer. We do not elevate; we **differentiate**.

*   **The Layering Principle:** Depth is achieved by "stacking" the surface-container tiers. A high-priority weather alert card should be `surface-container-lowest` (#FFFFFF) to "pop" against a `surface-container` (#EEEEEE) dashboard.
*   **Ambient Shadows:** Shadows are almost entirely eliminated. If a floating element (like a critical system override) requires a shadow for legibility, use a **Ghost Shadow**: `on-surface` color at 4% opacity with a 32px blur. It should feel like a subtle atmospheric occlusion, not a drop shadow.
*   **Zero Radius:** All corners are `0px`. This reinforces the industrial, rugged nature of marine hardware.

---

## 5. Components

### Buttons
*   **Primary:** `primary` (#00450D) background with `on-primary` (#FFFFFF) text.
*   **Danger:** `tertiary-container` (#A60A15) background. 
*   **Interaction:** All buttons must have a minimum height/width of **48px** to accommodate gloved hands or shaky environments.
*   **States:** Hover states use `primary-container` (#1B5E20). No rounded corners.

### Input Fields
*   **Structure:** No outline. Use `surface-container-highest` (#E2E2E2) as the field background. 
*   **Focus:** A 3px solid block of `primary` (#00450D) on the bottom edge only.

### Cards & Lists
*   **The Divider Ban:** Never use `1px` lines to separate list items. Use a 4px vertical gap or alternating tonal shifts (`surface-container-low` vs `surface-container-high`).
*   **Padding:** Aggressive white space. Use a base-8 grid. Standard card padding is 24px.

### Marine-Specific Components
*   **The "Alert Banner":** A full-width, 64px tall block using `tertiary` (#7C000A) for Danger or `secondary` (#835400) for Advisory. Text is always centered and Bold Headline-SM.
*   **Data Strips:** High-density rows for engine telemetry using `surface-variant` (#E2E2E2) to group related metrics.

---

## 6. Do's and Don'ts

### Do
*   **Do** use extreme contrast. If a component isn't passing WCAG AAA, it shouldn't be in the system.
*   **Do** use 0px border-radii for everything. Hard edges imply precision.
*   **Do** rely on typography weight to create hierarchy before relying on color.

### Don't
*   **Don't** use icons without labels. In marine safety, an icon can be misinterpreted; text cannot.
*   **Don't** use "Soft" colors. Every color must be the boldest, most functional version of itself.
*   **Don't** use animation for "delight." Use animation only to draw attention to a state change (e.g., a flashing Cyclone alert).

---

## 7. Directives for Junior Designers
When building a new view, ask yourself: *"If the cabin lights failed and I was looking at this through a red emergency lamp, could I still tell what the most dangerous problem is?"* If the answer is no, increase the contrast and simplify the layout. This system is about the beauty of utility.