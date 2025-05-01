<script>
  import { createEventDispatcher } from 'svelte';
  
  export let visible = true;
  let isLoading = false;
  
  const dispatch = createEventDispatcher();
  
  function toggleNodes() {
    if (isLoading) return; // Prevent multiple clicks
    
    isLoading = true;
    dispatch('toggle');
    
    // Reset loading state after a reasonable timeout
    setTimeout(() => {
      isLoading = false;
    }, 1500);
  }
</script>

<button id="toggle-all-nodes" on:click={toggleNodes} disabled={isLoading}>
  {#if isLoading}
    <span class="spinner"></span>
  {/if}
  {visible ? 'Hide All Nodes' : 'Show All Nodes'}
</button>

<style>
  #toggle-all-nodes {
    position: absolute;
    bottom: 40px;
    left: 10px;
    background: #ff9e44;
    color: #222;
    border: 2px solid #222;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    z-index: 1000;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  #toggle-all-nodes:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #222;
    border-radius: 50%;
    border-top-color: transparent;
    margin-right: 8px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
