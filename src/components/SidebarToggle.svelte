<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  function toggleSidebar() {
    dispatch('toggle');
  }
</script>

<button id="toggle-sidebar" on:click={toggleSidebar}>
  ≡
</button>

<style>
  #toggle-sidebar {
    position: absolute;
    top: 100px;
    left: 10px;
    width: 30px;
    height: 30px;
    background: #222;
    color: #fff;
    border: 2px solid #ff9e44;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
</style>
