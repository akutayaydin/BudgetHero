# Assets Folder

This folder contains static assets like images, icons, and other media files used in the BudgetHero application.

## Usage

To use assets from this folder in your components:

```typescript
// Import the asset (Vite will handle the bundling)
import myImage from "./assets/my-image.png";

// Use it in JSX
<img src={myImage} alt="Description" />
```

## File Organization

- `icons/` - SVG icons and icon files
- `images/` - Images used throughout the app  
- `logos/` - Company and brand logos
- `illustrations/` - Feature illustrations and graphics

## Supported Formats

- Images: `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`
- Icons: `.svg` (preferred for scalability)