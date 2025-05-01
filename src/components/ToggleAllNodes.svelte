<script>
  import { createEventDispatcher } from 'svelte';
  
  export let visible = true;
  
  const dispatch = createEventDispatcher();
  
  function toggleNodes() {
    dispatch('toggle');
  }
</script>

<button id="toggle-all-nodes" on:click={toggleNodes}>
  {visible ? 'Hide All Nodes' : 'Show All Nodes'}
</button>

<style>
  #toggle-all-nodes {
    position: absolute;
    bottom: 40px;
    left: 10px;
    background: white;
    border: 1px solid #ccc;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
    z-index: 1000;
    font-size: 12px;
  }
</style>
