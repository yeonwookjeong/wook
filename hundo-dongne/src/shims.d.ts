// The site's lib/pairToken.ts encodes with Node's Buffer. The mini app never calls those two functions (it makes the
// same token in the browser, src/me.ts personToken); this only lets the shared file type-check here.
declare const Buffer: { from(data: string, encoding?: string): { toString(encoding?: string): string } };
