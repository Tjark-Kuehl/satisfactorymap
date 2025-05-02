<script>
  import { findIconPosition, getIconBackgroundPosition } from '../lib/iconUtils';
  
  // Props
  export let outsideColor = '#ff9e44';  // Border color
  export let resourceType = '';         // Resource type for icon selection
  export let iconAtlas = null;          // Reference to the icon atlas data
  export let size = 'medium';           // Size variant: small, medium, large
  export let onClick = null;            // Optional click handler
  export let tooltipText = null;        // Optional tooltip text
  
  // Dynamic size based on the size prop
  $: containerSize = size === 'small' ? 24 : size === 'large' ? 32 : 28;
  $: borderWidth = size === 'small' ? 2 : 3;
  $: iconScale = size === 'small' ? 0.4 : size === 'large' ? 0.5 : 0.45;
  
  // Get the correct position from the atlas
  $: iconPosition = iconAtlas && resourceType ? findIconPosition(iconAtlas, resourceType) : null;
  $: backgroundPosition = iconPosition ? getIconBackgroundPosition(iconPosition, iconAtlas?.iconSize || 64) : '0 0';
  
  // Get the base URL
  const baseUrl = import.meta.env.BASE_URL;
  
  // Handle click events if an onClick handler is provided
  function handleClick(event) {
    if (onClick) {
      onClick(event);
    }
  }
</script>

{#if onClick}
  <button 
    class="resource-node-button {size}"
    style="--container-size: {containerSize}px; --border-width: {borderWidth}px; --outside-color: {outsideColor};"
    on:click={handleClick}
    title={tooltipText || resourceType}
  >
    {#if iconPosition}
      <div 
        class="icon-container"
        style="background-image: url('{baseUrl}assets/icon-atlas.png'); background-position: {backgroundPosition}; transform: translate(-50%, -50%) scale({iconScale});"
      ></div>
    {/if}
  </button>
{:else}
  <div 
    class="resource-node {size}"
    style="--container-size: {containerSize}px; --border-width: {borderWidth}px; --outside-color: {outsideColor};"
    title={tooltipText || resourceType}
  >
    {#if iconPosition}
      <div 
        class="icon-container"
        style="background-image: url('{baseUrl}assets/icon-atlas.png'); background-position: {backgroundPosition}; transform: translate(-50%, -50%) scale({iconScale});"
      ></div>
    {/if}
  </div>
{/if}

<style>
  .resource-node {
    width: var(--container-size);
    height: var(--container-size);
    border-radius: 50%;
    border: var(--border-width) solid var(--outside-color);
    background-color: rgba(255, 255, 255, 0.9);
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .resource-node-button {
    width: var(--container-size);
    height: var(--container-size);
    border-radius: 50%;
    border: var(--border-width) solid var(--outside-color);
    background-color: rgba(255, 255, 255, 0.9);
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: transform 0.1s ease-in-out;
  }
  
  .resource-node-button:hover {
    transform: scale(1.1);
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  }
  
  .icon-container {
    width: 64px;
    height: 64px;
    background-repeat: no-repeat;
    background-size: 320px 320px; /* 5 columns × 64px icons */
    position: absolute;
    top: 50%;
    left: 50%;
  }
  
  .small {
    width: 24px;
    height: 24px;
  }
  
  .medium {
    width: 28px;
    height: 28px;
  }
  
  .large {
    width: 32px;
    height: 32px;
  }
</style>
