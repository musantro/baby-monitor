---
name: Nocturne Guard
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bacac5'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#859490'
  outline-variant: '#3c4a46'
  surface-tint: '#3cddc7'
  primary: '#57f1db'
  on-primary: '#003731'
  primary-container: '#2dd4bf'
  on-primary-container: '#00574d'
  inverse-primary: '#006b5f'
  secondary: '#cebdff'
  on-secondary: '#381385'
  secondary-container: '#4f319c'
  on-secondary-container: '#bea8ff'
  tertiary: '#ffced0'
  on-tertiary: '#67001b'
  tertiary-container: '#ffa6ac'
  on-tertiary-container: '#9d002e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#62fae3'
  primary-fixed-dim: '#3cddc7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#e8ddff'
  secondary-fixed-dim: '#cebdff'
  on-secondary-fixed: '#21005e'
  on-secondary-fixed-variant: '#4f319c'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  status-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  safe-area-bottom: 32px
---

## Brand & Style

The design system is centered on the "Nocturne Guard" philosophy—providing a digital presence that feels like a quiet, watchful guardian. Targeted at parents navigating the late-night hours, the UI must minimize eye strain while maximizing reassurance.

The aesthetic is a blend of **Modern Minimalism** and **Glassmorphism**. By using deep, receding backgrounds and translucent, blurred foreground elements, the interface feels lightweight and non-intrusive. The goal is to evoke a sense of calm, safety, and unwavering reliability through a high-fidelity, polished technical execution.

## Colors

This design system utilizes a deep-sea palette to preserve night vision.

- **Primary (Soft Teal):** Used for active states, successful connections, and primary action highlights.
- **Secondary (Lavender):** Used for secondary features, subtle toggles, and decorative indicators.
- **Tertiary (Alert Rose):** Reserved strictly for critical notifications, such as high-decibel sound detection or disconnected camera alerts.
- **Backgrounds:** A base of Charcoal (#0F172A) provides the foundation, with Elevated Surface layers (#1E293B) used to define hierarchy.

## Typography

The typography system relies on **Inter** for its exceptional legibility in low-light conditions and systematic utility.

- **Status Hierarchy:** Use `status-xl` for immediate environmental readings (e.g., Room Temp: 22°C).
- **Legibility:** Maintain high contrast between text and background. Secondary information should use reduced opacity (70%) rather than mid-tone grays to maintain the "glass" look.
- **Mobile Scaling:** Large headlines scale down on mobile to ensure the video feed remains the focal point of the viewport.

## Layout & Spacing

The layout uses a **Fluid Grid** model with an emphasis on "Safe Zones" for one-handed operation during late-night use.

- **Video-First Layout:** The primary video stream is always center-stage. Controls are docked at the bottom or floating.
- **Rhythm:** A 4px baseline grid ensures consistent alignment. Component padding should default to 16px (4 units) for comfortable touch targets.
- **PWA Considerations:** Ensure a significant bottom margin (safe-area-bottom) to prevent interference with mobile OS gesture bars.

## Elevation & Depth

Hierarchy is established through **Glassmorphism** rather than traditional shadows.

- **Backdrop Blurs:** Any overlay (menus, settings, alerts) must use a background blur of 12px–20px with a 60% opacity fill of the surface color (#1E293B).
- **Luminescent Outlines:** Elevated elements should have a subtle 1px inner border (stroke) using a high-opacity version of the accent color or a white-transparent mix (10-20%) to simulate light catching the edge of the glass.
- **Depth Tiers:**
  - Tier 1 (Base): Charcoal background.
  - Tier 2 (Cards): Blurred surfaces.
  - Tier 3 (Modals/Popups): Heavily blurred surfaces with a distinct white-transparent border.

## Shapes

The shape language is organic and "soft-touch" to evoke a friendly, parental feel.

- **Base Radius:** 0.5rem (8px) for standard inputs.
- **Large Radius (2xl):** 1.5rem (24px) for cards and main containers.
- **Interactive Elements:** Buttons and floating action buttons use full "pill" rounding to signify comfort and tactile responsiveness.

## Components

### Buttons & Controls

- **Primary FAB (Push-to-Talk):** A large, circular floating action button featuring the soft teal accent. When active, it should have a subtle outer glow or "pulse" effect.
- **Glass Buttons:** Secondary actions should be transparent with a frosted blur and a 1px white border.

### Status Indicators

- **Connection Icons:** Small, glowing dots next to icons (Camera, Mic) to show "Live" status. Teal for active, Rose for error.
- **Sound Meter:** A horizontal bar component using a gradient from Teal to Lavender, peaking into Rose during loud events.

### Cards & Overlays

- **Information Cards:** Use the 2xl roundedness with glassmorphism. Content should be padded heavily (24px) to avoid visual clutter.

### Input Fields

- **Search & Settings:** Minimalist fields with a dark fill and a subtle Teal focus ring. Use the Inter `label-sm` for field descriptions.

### Lists

- **Activity Log:** Grouped by timestamp. Use thin, low-opacity separators (10% white) to divide entries without creating visual noise.
