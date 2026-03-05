

## Plan: Match Redeem Page to Figma Design

### Key Changes from Current Implementation

Based on the Figma design and uploaded reference image, these are the differences to fix:

**1. Remove liquid glass effects** -- Replace `glass-strong` cards with solid white (`bg-white`) cards with large rounded corners (`rounded-3xl`). Remove the ambient blur blobs from the background.

**2. Card layout** -- The white card starts partway down the orange background and extends to the bottom of the viewport (no bottom rounded corners visible). The card has rounded top corners only and fills remaining space.

**3. Typography -- all Inter font family:**
- Discount value (e.g. "10% OFF"): ~28px bold, orange color (`text-primary`)
- Offer title (e.g. "Get 10% OFF your order"): ~16px semibold, black
- Offer description: ~13px regular, dark gray
- Labels ("Mobile Number", "Name"): ~13px medium, dark/black
- Placeholder text: ~14px regular, gray
- Button text ("Claim Coupon"): ~16px semibold, white
- Footer hint: ~11px, gray
- "Coupon Claimed" heading: ~26px bold, orange
- "Already Claimed" heading: ~26px bold, orange
- Coupon code: ~18px mono bold
- Campaign subtitle under logo: ~13px, white/light

**4. Input fields** -- Simple bordered inputs with light gray background, rounded corners (~12px radius), no colored borders. Height ~44px.

**5. Button** -- Full-width solid orange button (gradient-cafe), large rounded corners (~14px), no excessive shadow. Padding ~14px vertical.

**6. Logo** -- Centered at top, roughly h-10 to h-12 size.

**7. Success screen (Coupon Claimed):**
- Open box image centered on the orange area above the card
- "Coupon Claimed" in orange, bold
- Coupon code in a bordered box with copy button
- Helper text below

**8. Already Claimed screen:**
- Green checkmark circle icon (using the check.png asset)
- "Already Claimed" in orange bold
- Subtitle text in gray

**9. Remove "Powered by ZIP Solutions" footer** -- Not visible in the Figma design (or make it very subtle).

### Files to Modify

- **`src/pages/Redeem.tsx`** -- Complete restyle of all state cards:
  - Remove ambient blob divs
  - Replace `glass-strong` with `bg-white`
  - Change card shape to rounded-top-only, full-width bottom
  - Adjust all font sizes, weights, and families to match Figma
  - Adjust spacing and padding
  - Remove excessive shadows
  - Ensure all text uses Inter (`font-sans` or explicit `font-[Inter]`)
  - Headings should also use Inter (override the Playfair Display default for h1-h4)

- **`src/index.css`** -- Potentially no changes needed; Inter is already imported. May need to ensure the `font-[Inter]` override works on headings within the redeem page.

### No database or backend changes required.

