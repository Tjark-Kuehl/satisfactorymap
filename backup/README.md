# Satisfactory Interactive Map

An interactive web-based map for the game Satisfactory that allows players to locate and filter resources.

## Features

- Interactive map with zoom and pan functionality
- Resource markers with filtering capabilities
- Resource node information on click
- Toggle visibility of all nodes with a single button
- High-quality icons for all resource types
- Custom zoom levels from -30 to +2
- Game-like coordinate system
- Biome detection

## Project Structure

```
InteractiveMap/
├── js/
│   └── map.js                # Main JavaScript for map functionality
├── public/
│   ├── assets/
│   │   ├── Map.webp          # Map image
│   │   └── icons/            # Resource icons
│   ├── data/
│   │   └── resources.json    # Resource data
│   ├── favicon.ico
│   └── robots.txt
├── index.html                # Main HTML file
├── package.json              # Project dependencies
├── package-lock.json
├── server.js                 # Main server file
└── README.md                 # This file
```

## Usage

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

3. Open your browser and navigate to http://localhost:3002
