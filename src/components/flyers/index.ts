export { OfferCard } from './OfferCard';
export { CatalogueCard } from './CatalogueCard';
export { SavePageButton } from './SavePageButton';

// Platform-specific export for CataloguePDFViewer
// Metro bundler will automatically choose:
// - CataloguePDFViewer.web.tsx for web
// - CataloguePDFViewer.native.tsx for iOS/Android
export { CataloguePDFViewer } from './CataloguePDFViewer';

// Platform-specific export for PDFPageViewer
// Metro bundler will automatically choose:
// - PDFPageViewer.web.tsx for web
// - PDFPageViewer.native.tsx for iOS/Android
export { PDFPageViewer } from './PDFPageViewer';

// Export additional components
export { PDFThumbnailStrip } from './PDFThumbnailStrip';
