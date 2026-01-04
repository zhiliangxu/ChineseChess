# Chinese Chess (中國象棋)

A classic Chinese Chess game implemented in TypeScript, running completely in the browser.

## Features

*   **Pure Client-Side**: Runs entirely in your web browser with no server-side dependencies for gameplay.
*   **Game Modes**:
    *   **Player vs Player (PvP)**: Play against a friend on the same device.
    *   **Player vs Computer (PvE)**: Challenge the AI.
*   **AI Difficulty Levels**:
    *   Easy (初級)
    *   Medium (中級)
    *   Hard (高級)
*   **Game Rules**: Implements standard Chinese Chess rules including perpetual check/chase detection.
*   **Responsive Design**: Clean interface with traditional board aesthetics.

## Getting Started

### Prerequisites

*   Node.js (v14 or higher recommended)
*   npm (Node Package Manager)

### Play it

* Go to [中國象棋](https://zhiliangxu.github.io/chinese-chess).

### Running Development Server

To start the local development server:

```bash
npm run dev
```

Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

### Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory. You can preview the production build locally using:

```bash
npm run preview
```

## Technologies Used

*   **TypeScript**: For type-safe logic.
*   **Vite**: Next Generation Frontend Tooling.
*   **HTML/CSS**: For structure and styling.

## License

MIT
