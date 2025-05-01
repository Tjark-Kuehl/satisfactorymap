<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  // Component props
  export let resourceData = { options: [] };
  export let iconAtlas = { columns: 1, rows: 1, iconSize: 64, resourceMapping: {} };
  export let visibleResources = {};
  export let toggleResourceVisibility;
  export let collapsed = false;
  
  // Local state
  let activeTab = 'resources';
  let searchQuery = '';
  let collapsedCategories = {};
  let collapsedSubCategories = {};
  
  // Import BASE_URL for asset references
  const baseUrl = import.meta.env.BASE_URL;
  
  // Function to toggle resource visibility
  function toggleResource(e, resourceId) {
    const checked = e.target.checked;
    toggleResourceVisibility(resourceId, checked);
  }
  
  // Function to set the active tab
  function setActiveTab(tab) {
    activeTab = tab;
  }
  
  // Function to toggle category
  function toggleCategory(categoryName) {
    collapsedCategories[categoryName] = !collapsedCategories[categoryName];
  }
  
  // Function to toggle sub-category
  function toggleSubCategory(subCategoryName) {
    collapsedSubCategories[subCategoryName] = !collapsedSubCategories[subCategoryName];
  }
  
  // Filter resources based on search query
  $: filteredResources = (category) => {
    if (!category || !category.options) return [];
    if (!searchQuery) return category.options;
    
    return category.options.filter(subCategory => {
      if (subCategory.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
      
      // Also check nested resource types
      return subCategory.options.some(resource => 
        resource.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };
  
  // Function to find the position of an icon in the atlas
  function findIconPosition(resourceKey) {
    if (!iconAtlas || !resourceKey) return null;
    
    // Try direct match in resourceMapping
    if (iconAtlas.resourceMapping && iconAtlas.resourceMapping[resourceKey]) {
      return iconAtlas.resourceMapping[resourceKey];
    }
    
    // Default to first position if no match
    return { x: 0, y: 0 };
  }
</script>

<div class="sidebar" class:collapsed={collapsed}>
  <div class="sidebar-header">
    <h1>Satisfactory Interactive Map</h1>
    
    {#if activeTab === 'resources'}
      <div class="search-container">
        <input 
          id="search-input" 
          type="text" 
          placeholder="Search resources..." 
          bind:value={searchQuery}
        >
      </div>
    {/if}
  </div>
  
  <div class="tabs" role="tablist">
    <button 
      class="tab" 
      class:active={activeTab === 'resources'} 
      on:click={() => setActiveTab('resources')}
      aria-selected={activeTab === 'resources' ? 'true' : 'false'}
      role="tab"
    >
      Resources
    </button>
    <button 
      class="tab" 
      class:active={activeTab === 'info'} 
      on:click={() => setActiveTab('info')}
      aria-selected={activeTab === 'info' ? 'true' : 'false'}
      role="tab"
    >
      Info
    </button>
  </div>
  
  <div class="tab-content" class:active={activeTab === 'resources'}>
    {#if resourceData && resourceData.options}
      {#each resourceData.options as category}
        <button 
          class="category-header" 
          on:click={() => toggleCategory(category.name)}
          on:keydown={(e) => e.key === 'Enter' && toggleCategory(category.name)}
          aria-expanded={!collapsedCategories[category.name]}
        >
          {category.name || category.tabId || 'Unknown Category'}
        </button>
        
        {#each category.options as subCategory}
          <div class="subcategory" class:collapsed={collapsedCategories[category.name]}>
            <button 
              class="subcategory-header" 
              on:click={() => toggleSubCategory(subCategory.name)}
              on:keydown={(e) => e.key === 'Enter' && toggleSubCategory(subCategory.name)}
              aria-expanded={!collapsedSubCategories[subCategory.name]}
            >
              {subCategory.name}
            </button>
            
            {#each subCategory.options as resourceType}
              {#if resourceType && resourceType.name}
                {@const resourceId = resourceType.layerId || resourceType.name.toLowerCase().replace(/\s+/g, '_')}
                {@const resourceKey = resourceType.name.toLowerCase()}
                {@const position = findIconPosition(resourceKey)}
                
                <div class="resource-item">
                  <label class="resource-label">
                    <input 
                      type="checkbox" 
                      class="resource-toggle" 
                      checked={visibleResources[resourceId]}
                      on:change={(e) => toggleResource(e, resourceId)}
                    >
                    <div class="atlas-icon" style="
                      width: 24px;
                      height: 24px;
                      overflow: hidden;
                    ">
                      {#if position}
                        <div class="atlas-icon-inner" style="
                          width: {iconAtlas.iconSize}px;
                          height: {iconAtlas.iconSize}px;
                          transform: scale(0.375);
                          transform-origin: top left;
                          background-image: url({baseUrl}assets/icon-atlas.png);
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
    margin-bottom: 10px;
  }
  
  .tab {
    flex: 1;
    padding: 10px 5px;
    text-align: center;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    background: none;
    color: white;
    border-top: none;
    border-left: none;
    border-right: none;
  }
  
  .tab.active {
    border-bottom-color: #ff9e44;
    color: #ff9e44;
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
    cursor: pointer;
    border: none;
    width: 100%;
    text-align: left;
    color: white;
  }
  
  .subcategory {
    margin-bottom: 15px;
    padding-left: 10px;
  }
  
  .subcategory.collapsed {
    display: none;
  }
  
  .subcategory-header {
    color: #ff9e44;
    font-size: 16px;
    margin-bottom: 8px;
    padding: 2px 0;
    cursor: pointer;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
  }
  
  .resource-item {
    padding: 2px 0;
    font-size: 14px;
    display: flex;
    align-items: center;
  }
  
  .atlas-icon {
    margin-right: 10px;
    position: relative;
  }
  
  .resource-label {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
  }
</style>
