# PDF Page-by-Page Viewer Feature

## Overview
This feature adds an interactive PDF page-by-page viewer similar to the Marktguru app, allowing users to view PDF catalogues page by page, navigate between pages, and save individual pages to their shopping basket.

## Architecture

### Components

#### 1. PDFPageViewer (Platform-Specific)
The main viewer component with two platform-specific implementations:

**PDFPageViewer.web.tsx**
- Uses `pdfjs-dist` library to render PDF pages
- Renders each page to canvas and converts to base64 image
- Caches rendered pages for performance
- Includes zoom controls (0.5x to 3x)
- Shows loading state while rendering

**PDFPageViewer.native.tsx**
- Uses `react-native-pdf` for native rendering
- Horizontal swipe navigation built-in
- Page-by-page viewing with enablePaging
- Native gesture support

**Common Features:**
- Navigation buttons (Previous/Next)
- Page indicator (current / total)
- Thumbnail strip overlay for quick navigation
- Save page button with saved state indicator
- Full-screen modal view
- RTL support

### Redux Integration

#### New Action: `addPdfPageToBasket`
```typescript
addPdfPageToBasket({
  catalogueId: string,
  catalogueTitle: string,
  pageNumber: number,
  pageImageUri: string,
  storeName: string,
  endDate: string,
})
```

This action:
- Checks for duplicate pages before adding
- Stores page as a basket item with type 'page'
- Includes page image URI (base64 for web, URL reference for native)
- Adds to beginning of basket items array

### Type Definitions

```typescript
interface PDFPageViewerProps {
  pdfUrl: string;
  catalogueTitle: string;
  catalogueId: string;
  visible: boolean;
  onClose: () => void;
  onSavePage?: (pageNumber: number, pageImageUri: string) => void;
  savedPages?: number[]; // Already saved page numbers
}

interface PageData {
  pageNumber: number;
  imageDataUrl: string; // Base64 or URI
  width: number;
  height: number;
}
```

## User Flow

1. User opens a catalogue from the Flyers screen
2. User taps "Interactive View" button to open PDF page viewer
3. PDF loads and first page is displayed
4. User navigates pages using:
   - Swipe gestures (native)
   - Previous/Next buttons
   - Thumbnail strip
5. User can zoom in/out on pages (web only)
6. User taps "Save" button to save current page to basket
7. Saved pages show bookmark badge in thumbnail strip
8. User closes viewer and can view saved pages in basket

## Integration Points

### Flyer Detail Screen (`src/app/flyer/[id].tsx`)
- Added `showInteractivePDF` state for modal visibility
- Added `handleOpenInteractivePDF()` handler
- Added `handleSavePdfPage()` handler for Redux integration
- Tracks `savedPdfPages` from basket for visual indicators
- Added "Interactive View" button alongside existing PDF button

### Basket Components
The existing `SavedPageCard` component handles display of saved PDF pages:
- Shows page thumbnail image
- Displays page number and catalogue title
- Shows store name and expiry date
- Allows removal from basket

## Performance Considerations

### Web (pdfjs-dist)
- **Page Caching**: Rendered pages stored in Map for instant re-display
- **Lazy Rendering**: Pages rendered on-demand, not all at once
- **Canvas Reuse**: Single canvas element reused for all rendering
- **Image Compression**: Pages stored as PNG base64 (could optimize to JPEG)

### Native (react-native-pdf)
- **Built-in Caching**: react-native-pdf handles page caching
- **Hardware Acceleration**: Native rendering uses device GPU
- **Memory Management**: Automatic cleanup by native PDF library

## Security

### Vulnerability Fix
- Initial requirement specified `pdfjs-dist@^3.11.174`
- **Security Issue**: Version <=4.1.392 vulnerable to arbitrary JavaScript execution
- **Fixed**: Updated to `pdfjs-dist@^4.2.67` (patched version)
- **CVE**: PDF.js vulnerable to malicious PDF execution

## Testing Checklist

- [ ] Web: Load PDF with pdfjs-dist
- [ ] Web: Navigate pages with buttons
- [ ] Web: Zoom in/out functionality
- [ ] Web: Save page to basket
- [ ] Web: Thumbnail strip navigation
- [ ] Native: Load PDF with react-native-pdf
- [ ] Native: Swipe navigation
- [ ] Native: Save page to basket
- [ ] Both: Saved page indicators on thumbnails
- [ ] Both: Prevent duplicate page saves
- [ ] Both: Display saved pages in basket
- [ ] Both: Remove saved pages from basket
- [ ] Both: RTL layout support
- [ ] Large PDFs (50+ pages)
- [ ] Slow network conditions
- [ ] Error handling and retry

## Known Limitations

### Native Platform
- Page images saved as URL references, not actual image data
- Requires internet connection to view saved pages later
- Could be improved with actual screenshot capture using `react-native-view-shot`

### Web Platform
- Large PDFs may consume significant memory due to page caching
- No limit on cache size currently (could add LRU eviction)
- Base64 images increase basket storage size

## Future Enhancements

1. **Native Screenshot Capture**: Use `react-native-view-shot` to capture actual page images
2. **Thumbnail Previews**: Render low-res thumbnails in thumbnail strip
3. **Offline Support**: Cache PDF files locally for offline viewing
4. **Search**: Add text search within PDF
5. **Annotations**: Allow users to highlight or mark areas
6. **Share**: Share specific pages via social media
7. **Print**: Print saved pages
8. **Cache Management**: Implement LRU cache with size limits
9. **Image Optimization**: Use JPEG instead of PNG for smaller file sizes
10. **Progressive Loading**: Show low-res preview while high-res loads

## Dependencies Added

```json
{
  "pdfjs-dist": "^4.2.67"
}
```

Existing dependency used:
```json
{
  "react-native-pdf": "^6.7.3"
}
```

## Files Modified/Created

### Created:
- `src/components/flyers/PDFPageViewer.web.tsx`
- `src/components/flyers/PDFPageViewer.native.tsx`
- `src/components/flyers/PDFPageViewer.tsx`

### Modified:
- `package.json` - Added pdfjs-dist dependency
- `src/types/index.ts` - Added PDFPageViewer interfaces
- `src/components/flyers/index.ts` - Exported new component
- `src/store/slices/basketSlice.ts` - Added addPdfPageToBasket action
- `src/app/flyer/[id].tsx` - Integrated PDF page viewer

## Backward Compatibility

The implementation maintains full backward compatibility:
- Existing `CataloguePDFViewer` still available (iframe/native viewer)
- Existing `SavePageButton` and `addPageToBasket` still work for image-based pages
- New PDF viewer is an additional feature, not a replacement
- Both viewers can be used side-by-side
