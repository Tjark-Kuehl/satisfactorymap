<script>
  export let visible = true;
</script>

<div class="map-loading-overlay" class:hidden={!visible}>
  <div class="spinner"></div>
  <div class="loading-text">Loading map markers...</div>
</div>

<style>
  .map-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    pointer-events: none;
    transition: opacity 0.3s;
  }
  
  .map-loading-overlay.hidden {
    opacity: 0;
    visibility: hidden;
  }
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(255, 158, 68, 0.3);
    border-radius: 50%;
    border-top-color: #ff9e44;
    animation: spin 1s linear infinite;
  }
  
  .loading-text {
    position: absolute;
    top: calc(50% + 40px);
    font-weight: bold;
    color: #333;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
