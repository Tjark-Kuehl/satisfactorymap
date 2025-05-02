# Satisfactory Interactive Map (Svelte)

An interactive map for the game Satisfactory, allowing players to locate resources and plan their factory layouts. This version is built with Svelte for improved performance and a smaller codebase.

## Features

- Interactive map showing all resource nodes from Satisfactory
- Optimized icon atlas loading to reduce HTTP requests
- Responsive UI with a collapsible sidebar
- Search functionality for quickly finding specific resources
- Toggle visibility of resource types
- Coordinates display for in-game reference

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at http://localhost:5173

### Production Build

```bash
# Build for production
npm run build
```

The production files will be output to the `/dist` directory.

## Project Structure and Configuration

### Source Data and Generated Files

- **resources.json**: Located in the project root, this is the main source of truth for resource data
- **Generated files**: The following files are generated during the build process and should not be committed:
  - `src/data/resources.js`: Optimized JavaScript module generated from resources.json
  - `public/assets/icon-atlas.png`: Sprite sheet containing all resource icons
  - `public/assets/icon-atlas.json`: Metadata for the icon atlas with position information

### Asset Naming Convention

- All resource icon files follow the pattern: `resource_name_256.png`
- Standardized icon keys are used throughout the application via the `iconKey` property
- Icon standardization and remapping happens in the resource processing stage, not in the UI components

### Build Process

```bash
# Generate the icon atlas from individual icons
npm run manage-assets

# Process resources.json data into optimized JS module
npm run process-resources

# Run the complete build process (assets, resources, and Vite build)
npm run build
```

## Implementation Details

The app is structured with the following components:

- **App.svelte**: Main application component and state manager
- **Map.svelte**: Leaflet map implementation with node placement
- **Sidebar.svelte**: Filterable resource sidebar with atlas-based icons
- **ResourceNode.svelte**: Reusable component for displaying resource icons consistently
- **MapSpinner.svelte**: Loading indicator for the map
- **CoordinatesDisplay.svelte**: Shows cursor position on the map
- **ToggleAllNodes.svelte**: Button to show/hide all nodes at once

## Performance Optimizations

- Icon atlas is loaded once and shared between components
- Map markers are processed asynchronously after UI is ready
- Sidebar is rendered immediately for fast user interaction
- Resource visibility toggling uses CSS rather than DOM manipulation
- System font stack for faster page loads without external dependencies

## Technical Advantages of Svelte

- **Smaller Bundle Size**: Svelte compiles components to highly efficient vanilla JavaScript
- **Reactive UI**: Built-in reactivity with no virtual DOM overhead
- **No Runtime Library**: Unlike React or Vue, Svelte has virtually no runtime
- **Simplified State Management**: State is handled simply without complex libraries

## Directory Structure

```
/public          - Static assets (map images, icons, etc.)
  /assets        - Asset files including icon atlas
    /icons       - Individual resource icons
/scripts         - Utility scripts for development
  asset-manager.js - Manages assets (renaming and atlas generation)
  process-resources.js - Processes resource data into optimized format
  build.js       - Orchestrates the complete build process
/src             - Source code
  /components    - Svelte components
  /data          - Generated data modules
  /lib           - Utility functions
  /styles        - Common stylesheets
  App.svelte     - Main application component
  app.css        - Global styles
  main.js        - Application entry point
/.github         - GitHub workflows for CI/CD
```

## Dependencies

- **Leaflet.js**: Map rendering with Simple CRS for the Satisfactory coordinate system
- **Svelte**: Component framework
- **Vite**: Build tooling

## Configuration Notes

- The application uses local Leaflet CSS from node_modules, not CDN
- System font stack is used instead of Google Fonts for better performance
- All map icons use a standardized naming convention for consistency
- The application is configured for deployment to GitHub Pages

## Continuous Integration & Deployment

The project uses GitHub Actions for continuous integration and deployment:

- **CI Workflow**: Automatically builds and tests the application on push or pull request
- **Deploy Workflow**: Automatically deploys to GitHub Pages when changes are pushed to the main branch
