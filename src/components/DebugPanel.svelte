<script>
  import { createEventDispatcher } from 'svelte';
  
  export let entries = [];
  export let visible = false;
  
  const dispatch = createEventDispatcher();
  
  function toggleVisibility() {
    dispatch('toggle');
  }
</script>

<div id="icon-debug" style="display: {visible ? 'block' : 'none'}">
  {#each entries as entry}
    <p style="color: {entry.color || 'white'}">{entry.text}</p>
  {/each}
</div>

<button id="icon-debug-toggle" on:click={toggleVisibility}>
  {visible ? 'Hide Debug' : 'Debug Icons'}
</button>

<style>
  #icon-debug {
    position: fixed;
    right: 10px;
    bottom: 10px;
    width: 300px;
    height: 200px;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #444;
    color: white;
    padding: 10px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 12px;
    z-index: 1000;
  }
  
  #icon-debug-toggle {
    position: fixed;
    right: 10px;
    bottom: 220px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: 1px solid #444;
    padding: 5px 10px;
    cursor: pointer;
    z-index: 1000;
  }
</style>
