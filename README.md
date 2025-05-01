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
# OR
./build.sh
```

The production files will be output to the `/dist` directory.

## Implementation Details

The app is structured with the following components:

- **App.svelte**: Main application component and state manager
- **Map.svelte**: Leaflet map implementation with node placement
- **Sidebar.svelte**: Filterable resource sidebar with atlas-based icons
- **MapSpinner.svelte**: Loading indicator for the map
- **CoordinatesDisplay.svelte**: Shows cursor position on the map
- **ToggleAllNodes.svelte**: Button to show/hide all nodes at once
- **DebugPanel.svelte**: Optional debugging panel for troubleshooting

## Performance Optimizations

- Icon atlas is preloaded before UI rendering begins
- Map markers are processed asynchronously after UI is ready
- Sidebar is rendered immediately for fast user interaction
- Resource visibility toggling uses CSS rather than DOM manipulation

## Technical Advantages of Svelte

- **Smaller Bundle Size**: Svelte compiles components to highly efficient vanilla JavaScript
- **Reactive UI**: Built-in reactivity with no virtual DOM overhead
- **No Runtime Library**: Unlike React or Vue, Svelte has virtually no runtime
- **Simplified State Management**: State is handled simply without complex libraries

## Directory Structure

```
/public          - Static assets (map images, icon atlas, data files)
/scripts         - Utility scripts for development
  atlas-generator.js - Creates the icon atlas from individual icons
  node-type-mapping.json - Resource type mappings
/src             - Source code
  /components    - Svelte components
  App.svelte     - Main application component
  app.css        - Global styles
  main.js        - Application entry point
/.github         - GitHub workflows for CI/CD
```

## Development Scripts

```bash
# Run the development server
npm run dev

# Build for production
npm run build

# Generate the icon atlas (if icons are modified)
npm run generate-atlas

# Preview the production build
npm run preview
```

## Continuous Integration & Deployment

The project uses GitHub Actions for continuous integration and deployment:

- **CI Workflow**: Automatically builds and tests the application on push or pull request
- **Deploy Workflow**: Automatically deploys to GitHub Pages when changes are pushed to the main branch

Both workflows include optimized npm caching to significantly speed up build times:
- Caches node_modules directory between runs
- Implements conditional dependency installation based on cache hits
- Uses different cache keys based on package-lock.json to ensure cache freshness
