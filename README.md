# Medieval Strategy Game - Technical Documentation

## Overview
This project is a turn-based strategy game built as a monorepo containing a Node.js backend and a React.js frontend.

## Project Structure
- **root**: Contains project-wide configurations and documentation.
- **backend**: Node.js application handling game logic, state, and multiplayer interactions (future scope).
- **frontend**: React.js application for the game interface, rendering the board, cards, and animations.

## Tech Stack
- **Frontend**: React.js, CSS (Vanilla/Modules), SVG for graphics.
- **Backend**: Node.js (Express/Socket.io potentially).
- **Monorepo Management**: npm workspaces or simple folder structure.

## Setup Instructions

### Prerequisites
- Node.js (v14+ recommended)
- npm

### Installation
1.  Clone the repository.
2.  Navigate to the project root.
3.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Project
- **Backend**:
    ```bash
    cd backend
    npm start
    ```
- **Frontend**:
    ```bash
    cd frontend
    npm start
    ```

## Game Rules Summary
See `game.md` for the full game design and rules.

## Development Notes
- **Assets**: Card images are generated as SVGs.
- **State Management**: React state for local game loop (MVP).
