<script>
  import { createEventDispatcher } from 'svelte';
  
  export let resourceData;
  export let iconAtlas;
  
  let sidebarCollapsed = false;
  let activeTab = 'resources';
  let searchQuery = '';
  
  const dispatch = createEventDispatcher();
  
  // Function to toggle sidebar visibility
  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
  }
  
  // Function to set the active tab
  function setActiveTab(tabId) {
    activeTab = tabId;
  }
  
  // Function to toggle resource visibility
  function toggleResource(event, resourceId) {
    const checked = event.target.checked;
    dispatch('toggleResource', { resourceId, visible: checked });
  }
  
  // Filter resources based on search query
  $: filteredResources = (category) => {
    if (!category || !category.options) return [];
    
    return category.options.filter(subCategory => {
      if (!subCategory || !subCategory.options) return false;
      
      // Check if any option matches the search query
      return subCategory.options.some(resourceType => {
        if (!resourceType || !resourceType.name) return false;
        
        return resourceType.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  };
  
  // Function to find the position of an icon in the atlas
  function findIconPosition(resourceKey) {
    if (!iconAtlas || !resourceKey) return null;
    
    // Try direct match in resourceMapping
    if (iconAtlas.resourceMapping && iconAtlas.resourceMapping[resourceKey]) {
      return iconAtlas.resourceMapping[resourceKey];
    }
    
    // Additional lookups omitted for brevity
    // (This is the same as in the Map component)
    
    // If all else fails, use a default position
    return iconAtlas.resourceMapping['stone'] || { x: 0, y: 0 };
  }
</script>

<div class="sidebar" class:collapsed={sidebarCollapsed}>
  <div class="sidebar-header">
    <h1>Satisfactory Interactive Map</h1>
    <div class="search-container">
      <input type="text" id="search-input" placeholder="Search resources..." bind:value={searchQuery}>
    </div>
  </div>
  
  <div class="tabs">
    <div 
      class="sidebar-tab" 
      class:active={activeTab === 'resources'} 
      on:click={() => setActiveTab('resources')}
    >
      Resources
    </div>
    <div 
      class="sidebar-tab" 
      class:active={activeTab === 'info'} 
      on:click={() => setActiveTab('info')}
    >
      Info
    </div>
  </div>
  
  <div class="tab-content" class:active={activeTab === 'resources'}>
    {#if resourceData && resourceData.options}
      {#each resourceData.options as category}
        <div class="category-header">
          {category.name || category.tabId || 'Unknown Category'}
        </div>
        
        {#each filteredResources(category) as subCategory}
          <div class="subcategory">
            <h3 class="subcategory-title">{subCategory.name}</h3>
            
            {#each subCategory.options as resourceType}
              {#if resourceType && resourceType.name}
                {@const resourceId = resourceType.layerId || resourceType.name.toLowerCase().replace(/\s+/g, '_')}
                {@const resourceKey = resourceType.name.toLowerCase()}
                {@const position = findIconPosition(resourceKey)}
                
                <div class="resource-item">
                  <label class="resource-toggle-label">
                    <input 
                      type="checkbox" 
                      class="resource-toggle" 
                      checked 
                      on:change={(e) => toggleResource(e, resourceId)}
                    >
                    <div class="resource-icon">
                      {#if position}
                        <div class="atlas-icon-inner" style="
                          width: {iconAtlas.iconSize}px;
                          height: {iconAtlas.iconSize}px;
                          transform: scale(0.375);
                          transform-origin: top left;
                          background-image: url(${import.meta.env.BASE_URL}assets/icon-atlas.png);
                          background-position: {-position.x * iconAtlas.iconSize}px {-position.y * iconAtlas.iconSize}px;
                          background-size: {iconAtlas.columns * iconAtlas.iconSize}px {iconAtlas.rows * iconAtlas.iconSize}px;
                          background-repeat: no-repeat;
                        "></div>
                      {/if}
                    </div>
                    <span>
                      {resourceType.name}
                      {#if resourceType.markers && resourceType.markers.length}
                        ({resourceType.markers.length})
                      {/if}
                    </span>
                  </label>
                </div>
              {/if}
            {/each}
          </div>
        {/each}
      {/each}
    {/if}
  </div>
  
  <div class="tab-content" class:active={activeTab === 'info'}>
    <h3>About This Map</h3>
    <p>This is an interactive map for Satisfactory, showing resource nodes and other points of interest.</p>
    <p>Built with Svelte for improved performance and reduced bundle size.</p>
  </div>
  
  <button class="toggle-sidebar-button" on:click={toggleSidebar}>
    {sidebarCollapsed ? '»' : '«'}
  </button>
</div>

<style>
  .sidebar {
    width: 300px;
    height: 100%;
    background-color: #333;
    color: white;
    transition: all 0.3s;
    overflow-y: auto;
    z-index: 2;
    position: relative;
  }
  
  .sidebar.collapsed {
    width: 0;
    overflow: hidden;
  }
  
  .sidebar-header {
    padding: 15px;
    background-color: #222;
  }
  
  .sidebar-header h1 {
    font-size: 18px;
    margin-bottom: 10px;
  }
  
  .search-container {
    margin-top: 10px;
  }
  
  #search-input {
    width: 100%;
    padding: 8px;
    border: none;
    border-radius: 3px;
  }
  
  .tabs {
    display: flex;
    border-bottom: 1px solid #555;
  }
  
  .sidebar-tab {
    flex: 1;
    padding: 10px 5px;
    text-align: center;
    cursor: pointer;
    border-bottom: 3px solid transparent;
  }
  
  .sidebar-tab.active {
    border-bottom-color: #ff9e44;
  }
  
  .tab-content {
    display: none;
    padding: 10px 15px;
    height: calc(100% - 130px);
    overflow-y: auto;
  }
  
  .tab-content.active {
    display: block;
  }
  
  .category-header {
    background: #222;
    padding: 5px 10px;
    margin: 10px -15px;
    font-weight: bold;
  }
  
  .subcategory {
    margin-bottom: 15px;
  }
  
  .subcategory-title {
    font-size: 16px;
    margin-bottom: 8px;
    color: #ff9e44;
  }
  
  .resource-item {
    padding: 5px 0;
    font-size: 14px;
  }
  
  .resource-toggle-label {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
  }
  
  .resource-icon {
    width: 24px;
    height: 24px;
    position: relative;
    overflow: hidden;
    display: inline-block;
  }
  
  .toggle-sidebar-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: transparent;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
  }
</style>
