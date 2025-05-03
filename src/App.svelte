<script>
  import { onMount } from 'svelte';
  import Map from './components/Map.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import MapSpinner from './components/MapSpinner.svelte';
  import CoordinatesDisplay from './components/CoordinatesDisplay.svelte';
  import ToggleAllNodes from './components/ToggleAllNodes.svelte';
  import SidebarToggle from './components/SidebarToggle.svelte';
  import { loadIconAtlas } from './lib/iconUtils.js';
  
  // Import resources directly as a JS module
  import { resourceData, getDefaultVisibleResources } from './data/resources.js';
  
  // Global state
  let iconAtlas = null;
  let markerClusters = {};
  let map = null;
  let allNodesVisible = true;
  let isLoading = true;
  let debugInfo = [];
  let debugVisible = false;
  let sidebarCollapsed = false;
  let visibleResources = {};
  
  // References for components
  let mapComponent;
  let sidebarComponent;
  
  onMount(async () => {
    try {
      // Load the icon atlas once and pass it to all components
      iconAtlas = await loadIconAtlas(import.meta.env.BASE_URL);
      
      if (!iconAtlas) {
        throw new Error('Failed to load icon atlas');
      }
      
      // Preload the atlas image
      await preloadAtlasImage();
      
      // Start with all resources visible as the default state
      initializeResourceVisibility();
      
      // Check if we have a filter URL parameter and apply it
      const url = new URL(window.location);
      const filterParam = url.searchParams.get('f');
      
      if (filterParam) {
        loadFiltersFromURL();
      }
      
      // Only hide loading spinner after markers are processed
      setTimeout(() => {
        isLoading = false;
      }, 500);
    } catch (error) {
      console.error('Error initializing map:', error);
      errorMessage = `Failed to load map data: ${error.message}`;
      isLoading = false;
    }
  });
  
  /**
   * Preload the atlas image to ensure it's cached
   */
  async function preloadAtlasImage() {
    return new Promise((resolve, reject) => {
      if (!iconAtlas) {
        reject(new Error('Icon atlas not loaded'));
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to preload atlas image'));
      img.src = import.meta.env.BASE_URL + 'assets/icon-atlas.png';
    });
  }
  
  // Initialize all resources as hidden by default
  function initializeResourceVisibilityAsHidden() {
    visibleResources = {};
    resourceData.categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.resources.forEach(resource => {
          visibleResources[resource.id] = false;
        });
      });
    });
    // Ensure reactivity
    visibleResources = {...visibleResources};
  }
  
  // Initialize visibility for all resources as visible
  function initializeResourceVisibility() {
    // Create object with all resources set to visible
    const allVisible = {};
    
    // Set every resource to visible
    resourceData.categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.resources.forEach(resource => {
          allVisible[resource.id] = true;
        });
      });
    });
    
    // Update the state to trigger reactivity
    visibleResources = allVisible;
    
    console.log('Initialized all resources as visible:', Object.keys(visibleResources).length);
  }
  
  // Toggle visibility of all resource nodes
  function toggleAllNodes() {
    const isAllVisible = Object.values(visibleResources).every(v => v);
    
    // Set all resources to the opposite of current state
    resourceData.categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.resources.forEach(resource => {
          visibleResources[resource.id] = !isAllVisible;
        });
      });
    });
    
    // Update the visible resources state to trigger reactivity
    visibleResources = {...visibleResources};
    
    if (mapComponent) {
      mapComponent.updateAllMarkers(visibleResources);
    }
    
    // Save new filter state to URL
    saveFiltersToURL();
    
    return !isAllVisible;
  }
  
  // Toggle visibility of a specific resource type
  function toggleResourceVisibility(resourceId, visible) {
    // Always set the resource to the requested visibility state
    visibleResources[resourceId] = visible;
    visibleResources = {...visibleResources}; // Trigger reactivity
    
    if (mapComponent) {
      mapComponent.updateResourceMarkers(resourceId, visible);
    }
    
    // Save filter state to URL
    saveFiltersToURL();
  }
  
  /**
   * Save current filter state to URL in a compact format
   * We use a simple format like "?f=res1,res2,res3" where each res is a visible resource ID
   */
  function saveFiltersToURL() {
    // Create an array of visible resource IDs
    const visibleIds = Object.entries(visibleResources)
      .filter(([id, visible]) => visible)
      .map(([id]) => id);
      
    // Create URL params
    const url = new URL(window.location);
    
    if (visibleIds.length > 0) {
      // Only include visible resources in URL to keep it compact
      url.searchParams.set('f', visibleIds.join(','));
    } else {
      // If nothing is visible, use a special indicator
      url.searchParams.set('f', 'none');
    }
    
    // Update URL without reloading page
    window.history.replaceState({}, '', url);
  }
  
  /**
   * Load filter state from URL
   */
  function loadFiltersFromURL() {
    try {
      const url = new URL(window.location);
      const filterParam = url.searchParams.get('f');
      
      if (filterParam) {
        // Start by setting all resources to hidden
        resourceData.categories.forEach(category => {
          category.subcategories.forEach(subcategory => {
            subcategory.resources.forEach(resource => {
              visibleResources[resource.id] = false;
            });
          });
        });
        
        // If not 'none', make specified resources visible
        if (filterParam !== 'none') {
          const visibleIds = filterParam.split(',');
          
          // Only make valid resource IDs visible
          visibleIds.forEach(id => {
            if (id && id.trim() !== '') {
              visibleResources[id] = true;
            }
          });
        }
        
        // Update the global state to trigger reactivity
        visibleResources = {...visibleResources};
        
        console.log('Loaded filter state from URL:', filterParam);
        console.log('Visible resources:', Object.entries(visibleResources).filter(([_, v]) => v).map(([k]) => k));
      }
    } catch (error) {
      console.error('Error loading filters from URL:', error);
      // Fallback to all resources visible
      initializeResourceVisibility();
    }
  }
  
  /**
   * Add debug info to the debug panel
   */
  function appendDebugInfo(text, color = 'white') {
    debugInfo = [...debugInfo, { text, color }];
  }
  
  /**
   * Toggle debug panel visibility
   */
  function toggleDebugPanel() {
    debugVisible = !debugVisible;
  }
  
  /**
   * Toggle sidebar visibility
   */
  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
  }
  
  function handleToggleResource({ detail }) {
    toggleResourceVisibility(detail.resourceId, detail.visible);
  }
  
  function handleMapReady({ detail }) {
    // When the map is ready, update all markers based on the current filter state
    // This ensures URL filter parameters are applied immediately
    if (mapComponent) {
      console.log('Map component ready, applying filters');
      mapComponent.updateAllMarkers(visibleResources);
    }
  }
  
  function handleCoordsUpdate() {
    // Add your coords update logic here
  }
</script>

<svelte:head>
  <title>Satisfactory Interactive Map</title>
</svelte:head>

<div id="app" class:sidebar-collapsed={sidebarCollapsed}>
  <Sidebar 
    bind:this={sidebarComponent}
    {resourceData}
    {visibleResources}
    {iconAtlas}
    toggleResourceVisibility={toggleResourceVisibility}
    collapsed={sidebarCollapsed}
    on:toggle={toggleSidebar}
  />
  
  <div id="map-container">
    {#if iconAtlas}
      <Map 
        {resourceData} 
        {visibleResources}
        {iconAtlas}
        on:mapReady={handleMapReady}
        on:coordsupdate={handleCoordsUpdate}
        bind:this={mapComponent}
      />
    {/if}
    
    <MapSpinner visible={isLoading} />
    <CoordinatesDisplay />
    <ToggleAllNodes visible={allNodesVisible} on:toggle={toggleAllNodes} />
    <SidebarToggle on:toggle={toggleSidebar} />
  </div>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  :global(body) {
    font-family: 'Open Sans', sans-serif;
  }
  
  #app {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }
  
  #map-container {
    flex: 1;
    height: 100%;
    z-index: 1;
    position: relative;
  }
</style>
