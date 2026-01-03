# UI Changes - PDF Page Viewer

## Flyer Detail Screen Changes

### Before
```
[Flyer Detail Screen]
├── Header (Store logo + Catalogue title)
├── Page Image (with navigation arrows)
├── Save Page Button
└── PDF Button (opens simple viewer)
```

### After
```
[Flyer Detail Screen]
├── Header (Store logo + Catalogue title)
├── Page Image (with navigation arrows)
├── Button Row:
│   ├── Save Page Button
│   ├── Interactive View Button ← NEW
│   └── PDF Button (legacy viewer)
└── Offers Section
```

## New Interactive PDF Viewer Modal

```
┌─────────────────────────────────────────┐
│ [X]  Catalogue Title - Page 1/10  [≡]  │ ← Header
├─────────────────────────────────────────┤
│                                         │
│                                         │
│         PDF PAGE CONTENT                │
│         (Zoomable on web)               │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ [<] 1/10 [>]  [-] 100% [+] [⟲] [Save] │ ← Controls
└─────────────────────────────────────────┘

Features:
- [X] Close button
- [≡] Thumbnail grid toggle
- [<] Previous page
- [>] Next page
- [-] Zoom out (web)
- [+] Zoom in (web)
- [⟲] Reset zoom (web)
- [Save] Save page to basket (shows ✓ when saved)
```

## Thumbnail Grid Overlay

```
When user taps [≡]:

┌───────────────────────────────────┐
│ All Pages               [X]       │
├───────────────────────────────────┤
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│ │1 │ │2 │ │3 │ │4 │ │5 │ │6 │  │
│ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘  │
│                                   │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐             │
│ │7 │ │8 │ │9 │ │10│             │
│ └──┘ └──┘ └──┘ └──┘             │
└───────────────────────────────────┘

- Current page highlighted with border
- Saved pages have bookmark badge (🔖)
- Tap any thumbnail to jump to page
```

## Button Styling

### Interactive View Button
```
┌────────────────────────┐
│ 📑 عرض تفاعلي          │  ← Primary color border
└────────────────────────┘    White background
```

### PDF Button (Legacy)
```
┌────────────────────────┐
│ 📄 عرض PDF             │  ← Primary color border
└────────────────────────┘    White background
```

### Save Page Button
```
┌────────────────────────┐
│ 🔖 حفظ الصفحة         │  ← Primary color border
└────────────────────────┘    White background

When saved:
┌────────────────────────┐
│ ✓ تم الحفظ            │  ← Primary background
└────────────────────────┘    White text
```

## Basket Display

### Saved PDF Page Card
```
┌─────────────────────────────────────┐
│ ┌────┐                              │
│ │    │  🔖 صفحة محفوظة        [🗑️] │
│ │PDF │  Catalogue Title             │
│ │Page│  Store Name                  │
│ │    │  📄 صفحة 5  |  🏷️ 0 عرض    │
│ └────┘  ⏰ ينتهي في 2024-01-15      │
└─────────────────────────────────────┘
```

## Navigation Patterns

### Web Platform
- Click Previous/Next buttons
- Use keyboard arrows (← →)
- Click thumbnails to jump
- Scroll to zoom in/out
- Click zoom buttons

### Native Platform  
- Swipe left/right to change pages
- Tap Previous/Next buttons
- Tap thumbnails to jump
- Pinch to zoom (built-in)

## RTL Support

All UI elements automatically flip for Arabic (RTL) layout:
- Buttons order reversed
- Text alignment adjusted
- Icons direction maintained
- Navigation logic inverted

## Responsive Design

### Mobile (< 768px)
- Buttons stack vertically if needed
- Thumbnails grid adjusts to screen width
- Controls use minimal width

### Tablet/Desktop
- Buttons display in row
- More thumbnails visible
- Larger page display area
- Full zoom controls visible
