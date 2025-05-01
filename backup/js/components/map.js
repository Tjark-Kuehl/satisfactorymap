import L from 'leaflet';

/**
 * Initialize the Leaflet map with proper settings for Satisfactory
 * @returns {L.Map} - The Leaflet map instance
 */
export function initializeMap() {
    // Create the map with proper bounds for Satisfactory world
    const map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -10,
        maxZoom: -4,
        zoomControl: true,
        attributionControl: false
    });
    
    // Set map bounds based on the actual Satisfactory world size
    // Game coordinates range from -500,000 to 500,000 in both directions
    const bounds = [
        [-500000, -500000],  // Bottom left (SW) in [lat, lng] format
        [500000, 500000]     // Top right (NE) in [lat, lng] format
    ];
    
    // Add the Satisfactory map image as a layer
    const mapImage = L.imageOverlay('/public/assets/Map.webp', bounds);
    mapImage.addTo(map);
    
    // Set initial view to center of map
    map.setView([0, 0], -8);
    map.setMaxBounds(bounds);
    
    // Show coordinates on mousemove
    const coordsDisplay = document.getElementById('coords');
    if (coordsDisplay) {
        map.on('mousemove', (e) => {
            try {
                // Display map coordinates for debugging
                const x = Math.floor(e.latlng.lng);
                const y = Math.floor(e.latlng.lat);
                coordsDisplay.textContent = `X: ${x} | Y: ${y}`;
            } catch (error) {
                console.error('Error updating coordinates:', error);
            }
        });
    }
    
    return map;
}
