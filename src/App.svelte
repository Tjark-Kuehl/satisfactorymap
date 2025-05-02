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
  let visibleResources = getDefaultVisibleResources();
  
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
      
      // Initialize all resources as visible by default
      initializeResourceVisibility();
      
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
  
  // Initialize visibility for all resources
  function initializeResourceVisibility() {
    // Using the helper function from the resources module
    visibleResources = getDefaultVisibleResources();
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
    
    if (mapComponent) {
      mapComponent.updateAllMarkers(visibleResources);
    }
    
    return !isAllVisible;
  }
  
  // Toggle visibility of a specific resource type
  function toggleResourceVisibility(resourceId, visible) {
    if (visibleResources[resourceId] !== visible) {
      visibleResources[resourceId] = visible;
      visibleResources = {...visibleResources}; // Trigger reactivity
      
      if (mapComponent) {
        mapComponent.updateResourceMarkers(resourceId, visible);
      }
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
  
  function handleMapReady() {
    // Add your map ready logic here
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
    toggleResourceVisibility={handleToggleResource}
    collapsed={sidebarCollapsed}
    on:toggle={toggleSidebar}
  />
  
  <div id="map-container">
    {#if iconAtlas}
      <Map 
        {resourceData} 
        {visibleResources}
        {iconAtlas}
        on:mapready={handleMapReady}
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
