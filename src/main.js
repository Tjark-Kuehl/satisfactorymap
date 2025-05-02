import './app.css'
// Import Leaflet CSS from node_modules
import 'leaflet/dist/leaflet.css';
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app'),
})

export default app
