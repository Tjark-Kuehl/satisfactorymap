<script>
  import { createEventDispatcher } from 'svelte';
  import ResourceNode from './ResourceNode.svelte';
  import { findIconPosition } from '../lib/iconUtils';
  
  const dispatch = createEventDispatcher();
  
  // Component props
  export let resourceData = { categories: [] };
  export let visibleResources = {};
  export let toggleResourceVisibility;
  export let collapsed = false;
  export let iconAtlas = null; // Accept iconAtlas as a prop from parent
  
  // Import BASE_URL for asset references
  const baseUrl = import.meta.env.BASE_URL;
  
  // Local state
  let activeTab = 'resources';
  let searchQuery = '';
  let collapsedCategories = {};
  let collapsedSubCategories = {};
  
  // Function to toggle resource visibility
  function toggleResource(resourceId, checked) {
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
    if (!category || !category.subcategories) return [];
    if (!searchQuery) return category.subcategories;
    
    return category.subcategories.filter(subCategory => {
      if (subCategory.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
      
      // Also check nested resource types
      return subCategory.resources.some(resource => 
        resource.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };
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
    {#if resourceData && resourceData.categories}
      {#each resourceData.categories.filter(c => c && c.name && !c.name.toLowerCase().includes('unknown')) as category}
        <button 
          class="category-header" 
          on:click={() => toggleCategory(category.name)}
          on:keydown={(e) => e.key === 'Enter' && toggleCategory(category.name)}
          aria-expanded={!collapsedCategories[category.name]}
        >
          {category.name}
        </button>
        
        {#each category.subcategories.filter(sc => sc && sc.name && !sc.name.toLowerCase().includes('unknown')) as subcategory}
          <div class="subcategory" class:collapsed={collapsedCategories[category.name]}>
            <button 
              class="subcategory-header" 
              on:click={() => toggleSubCategory(subcategory.name)}
              on:keydown={(e) => e.key === 'Enter' && toggleSubCategory(subcategory.name)}
              aria-expanded={!collapsedSubCategories[subcategory.name]}
            >
              {subcategory.name}
            </button>
            
            {#each subcategory.resources.filter(rt => rt && rt.name && !rt.name.toLowerCase().includes('unknown')) as resource}
              {#if resource.name}
                <div 
                  class="resource-item" 
                  class:collapsed={collapsedSubCategories[subcategory.name]}
                >
                  {#if iconAtlas}
                    {#each [findIconPosition(resource.name)] as position}
                      {#if position}
                        <label class="resource-label">
                          <input 
                            type="checkbox" 
                            checked={visibleResources[resource.id] || false}
                            on:change={() => toggleResource(resource.id, !visibleResources[resource.id])}
                          />
                          <ResourceNode 
                            resourceType={resource.iconKey || resource.id}
                            outsideColor={resource.outsideColor}
                            iconAtlas={iconAtlas}
                            size="small"
                          />
                          <span class="resource-name">
                            {resource.name}
                            {#if resource.markers && resource.markers.length}
                              <span class="resource-count">({resource.markers.length})</span>
                            {/if}
                          </span>
                        </label>
                      {:else}
                        <label class="resource-label">
                          <input 
                            type="checkbox" 
                            checked={visibleResources[resource.id] || false}
                            on:change={() => toggleResource(resource.id, !visibleResources[resource.id])}
                          />
                          <ResourceNode 
                            resourceType={resource.iconKey || resource.id}
                            outsideColor={resource.outsideColor}
                            iconAtlas={iconAtlas}
                            size="small"
                          />
                          <span class="resource-name">
                            {resource.name}
                            {#if resource.markers && resource.markers.length}
                              <span class="resource-count">({resource.markers.length})</span>
                            {/if}
                          </span>
                        </label>
                      {/if}
                    {/each}
                  {:else}
                    <label class="resource-label">
                      <input 
                        type="checkbox" 
                        checked={visibleResources[resource.id] || false}
                        on:change={() => toggleResource(resource.id, !visibleResources[resource.id])}
                      />
                      <ResourceNode 
                        resourceType={resource.iconKey || resource.id}
                        outsideColor={resource.outsideColor}
                        iconAtlas={iconAtlas}
                        size="small"
                      />
                      <span class="resource-name">
                        {resource.name}
                        {#if resource.markers && resource.markers.length}
                          <span class="resource-count">({resource.markers.length})</span>
                        {/if}
                      </span>
                    </label>
                  {/if}
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
  
  .resource-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .resource-name {
    font-size: 14px;
  }
  
  .resource-count {
    font-size: 12px;
    color: #666;
  }
</style>
