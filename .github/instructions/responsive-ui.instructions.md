---
description: "Use when creating or modifying any UI element, component, page, or layout. Requires every UI to be responsive and adaptive across screen sizes (phone, tablet, laptop, monitor)."
name: "Responsive & Adaptive UI"
applyTo: "src/**/*.{jsx,tsx,css}"
---

# Responsive & Adaptive UI

Every UI element or component created or modified MUST be flexible and adapt to
different screen sizes: **phone, tablet, laptop, and large monitor**. Never ship
a fixed layout that only looks right on one screen.

## Requirements

- **Fluid by default.** Prefer relative units and flexible layouts (`%`, `rem`,
  `fr`, `flex`, `minmax`, `clamp()`) over fixed pixel widths. Avoid hard-coded
  widths/heights that can overflow small screens.
- **Use responsive props / breakpoints.** With Mantine, use object syntax for
  responsive values (e.g. `cols={{ base: 1, sm: 2, md: 3 }}`,
  `span={{ base: 12, md: 4 }}`, responsive `size`/`gutter`/`visibleFrom`/
  `hiddenFrom`). In CSS, use media/container queries — mobile-first (`base`
  first, then scale up).
- **Layout primitives.** Compose with `Grid`, `SimpleGrid`, `Flex`, `Stack`,
  and `Group` (with `wrap`) so content reflows instead of overflowing.
- **Touch friendly.** Keep interactive targets comfortably tappable on phones
  and ensure content is reachable without horizontal scrolling.
- **No overflow.** Long text should wrap, truncate (`lineClamp`), or scroll
  within a bounded container — it must not break the layout.
- **Images/media** scale with their container (`max-width: 100%`, responsive
  sizing).

## Verify before finishing

Mentally (or in the browser dev tools) check the component at representative
widths: ~375px (phone), ~768px (tablet), ~1024px (laptop), ~1440px+ (monitor).
It must remain usable and unbroken at each.

## Example

```jsx
// ✅ Adapts: 1 column on phones, 2 on tablets, 3 on desktops
<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={{ base: "sm", md: "lg" }}>
  {items.map((item) => (
    <Card key={item.id} withBorder radius="lg">
      <Text lineClamp={1}>{item.title}</Text>
    </Card>
  ))}
</SimpleGrid>
```

## Anti-pattern (do NOT do this)

```jsx
// ❌ Fixed width overflows small screens; no breakpoints
<div style={{ width: 900 }}>...</div>
```
