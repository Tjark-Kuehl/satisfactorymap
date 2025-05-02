# Changelog

All notable changes to the Satisfactory Interactive Map project will be documented in this file.

## [Unreleased]

### Added
- Created a reusable `ResourceNode` component to standardize the display of resource icons in both the map and sidebar
- Implemented responsive sizing for different variants (small, medium, large)
- Added accessibility improvements by using button elements for interactive nodes with keyboard navigation
- Implemented tooltip support for resource nodes

### Changed
- Refactored icon mapping logic into a shared utility file (`iconUtils.js`)
- Enhanced the `findIconPosition` function to fetch icon positions based on resource type
- Standardized icon styling across the application with white background and colored borders
- Updated both map and sidebar components to use the new `ResourceNode` component
- Extracted common CSS into a shared stylesheet for resource nodes
- Cleaned up asset file naming for consistency
- Improved remapping logic by handling it at the resource processing stage

### Fixed
- Fixed issues with icon display in sidebar and map
- Addressed inconsistent mapping of resource names to their icons
- Ensured all resources display correctly with proper icons and styling

### Technical
- Reduced code duplication by centralizing resource node display logic
- Improved performance by optimizing the icon position lookup
