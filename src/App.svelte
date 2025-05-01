<script>
  import { onMount } from 'svelte';
  import Map from './components/Map.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import MapSpinner from './components/MapSpinner.svelte';
  import CoordinatesDisplay from './components/CoordinatesDisplay.svelte';
  import ToggleAllNodes from './components/ToggleAllNodes.svelte';
  import DebugPanel from './components/DebugPanel.svelte';
  
  // Global state
  let resourceData = null;
  let iconAtlas = null;
  let markerClusters = {};
  let map = null;
  let allNodesVisible = true;
  let isLoading = true;
  let debugInfo = [];
  let debugVisible = false;
  
  // References for components
  let mapComponent;
  
  onMount(async () => {
    try {
      // Load the icon atlas first
      const atlasResponse = await fetch('/assets/icon-atlas.json');
      if (!atlasResponse.ok) {
        throw new Error(`Failed to load icon atlas: ${atlasResponse.status}`);
      }
      iconAtlas = await atlasResponse.json();
      
      // Preload the atlas image
      await preloadAtlasImage();
      
      // Then load the resource data
      const resourceResponse = await fetch('/data/resources.json');
      if (!resourceResponse.ok) {
        throw new Error(`Failed to load resources: ${resourceResponse.status}`);
      }
      resourceData = await resourceResponse.json();
      
      // Only hide loading spinner after markers are processed
      setTimeout(() => {
        isLoading = false;
      }, 100);
    } catch (error) {
      console.error('Error initializing application:', error);
      appendDebugInfo(`Failed to initialize: ${error.message}`, 'red');
    }
  });
  
  /**
   * Preload the atlas image to ensure icons appear immediately
   */
  function preloadAtlasImage() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => {
        console.error('Error preloading atlas image');
        resolve();
      };
      img.src = '/assets/icon-atlas.png';
    });
  }
  
  /**
   * Toggle visibility of resource markers
   */
  function toggleResourceVisibility(resourceId, visible) {
    if (mapComponent) {
      mapComponent.toggleResourceVisibility(resourceId, visible);
    }
  }
  
  /**
   * Toggle all nodes visibility
   */
  function toggleAllNodes() {
    allNodesVisible = !allNodesVisible;
    if (mapComponent) {
      mapComponent.toggleAllNodes(allNodesVisible);
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
</script>

<svelte:head>
  <title>Satisfactory Interactive Map</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div id="app">
  <Sidebar 
    {resourceData} 
    {iconAtlas} 
    on:toggleResource={({ detail }) => toggleResourceVisibility(detail.resourceId, detail.visible)} 
  />
  
  <div id="map-container">
    {#if resourceData && iconAtlas}
      <Map 
        {resourceData} 
        {iconAtlas} 
        bind:this={mapComponent} 
        on:appendDebug={({ detail }) => appendDebugInfo(detail.text, detail.color)} 
      />
    {/if}
    
    <MapSpinner visible={isLoading} />
    <CoordinatesDisplay />
    <ToggleAllNodes visible={allNodesVisible} on:toggle={toggleAllNodes} />
  </div>
  
  <button id="toggle-sidebar">≡</button>
  
  <DebugPanel 
    entries={debugInfo} 
    visible={debugVisible} 
    on:toggle={toggleDebugPanel} 
  />
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
  
  #toggle-sidebar {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1000;
    background: white;
    border: 1px solid #ccc;
    width: 30px;
    height: 30px;
    text-align: center;
    line-height: 30px;
    cursor: pointer;
    border-radius: 3px;
    font-weight: bold;
  }
</style>
