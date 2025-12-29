import './style.css';

/**
 * Game Constants & State
 */
const BOARD_WIDTH = 9;
const BOARD_HEIGHT = 10;
const CELL_SIZE = 70;
const OFFSET = 35;

// Pieces: [Type, Color] (Color: 0=Red, 1=Black)
// Types: 'g'=General, 'a'=Advisor, 'e'=Elephant, 'h'=Horse, 'r'=Chariot(Rook), 'c'=Cannon, 's'=Soldier
const RED = 0;
const BLACK = 1;

type PieceType = 'g' | 'a' | 'e' | 'h' | 'r' | 'c' | 's';
type PlayerColor = typeof RED | typeof BLACK;

interface Piece {
    type: PieceType;
    color: PlayerColor;
}

interface Move {
    r: number;
    c: number;
}

interface FullMove {
    fromR: number;
    fromC: number;
    toR: number;
    toC: number;
}

const PIECE_TEXT: Record<PieceType, [string, string]> = {
    'g': ['帥', '將'], 'a': ['仕', '士'], 'e': ['相', '象'],
    'h': ['傌', '馬'], 'r': ['俥', '車'], 'c': ['炮', '砲'], 's': ['兵', '卒']
};

let board: (Piece | null)[][] = []; // 10x9 array
let turn: PlayerColor = RED;
let selectedPiece: Move | null = null;
let gameOver = false;
let gameMode: 'pvp' | 'pve' = 'pvp';
let aiColor: PlayerColor = BLACK;
let aiDifficulty: 'easy' | 'medium' | 'hard' = 'medium';

/**
 * Initialization
 */
function init(): void {
    renderGrid();
    resetGame();
    setupEventListeners();
}

function setupEventListeners(): void {
    document.getElementById('btn-pvp')?.addEventListener('click', () => setMode('pvp'));
    document.getElementById('btn-pve')?.addEventListener('click', () => setMode('pve'));
    document.getElementById('btn-restart')?.addEventListener('click', () => resetGame());
    document.getElementById('difficulty-select')?.addEventListener('change', (e) => {
        aiDifficulty = (e.target as HTMLSelectElement).value as any;
    });
}

function resetGame(): void {
    board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
    turn = RED;
    gameOver = false;
    selectedPiece = null;
    updateStatus("紅方回合");
    setupBoard();
    renderPieces();
    clearHighlights();
}

function setMode(mode: 'pvp' | 'pve'): void {
    gameMode = mode;
    const btnPvp = document.getElementById('btn-pvp');
    const btnPve = document.getElementById('btn-pve');
    const diffContainer = document.getElementById('difficulty-container');
    
    if (btnPvp) btnPvp.className = mode === 'pvp' ? 'active' : '';
    if (btnPve) btnPve.className = mode === 'pve' ? 'active' : '';
    if (diffContainer) diffContainer.style.display = mode === 'pve' ? 'flex' : 'none';
    
    resetGame();
}

/**
 * Board Setup
 */
function setupBoard(): void {
    const setup: (PieceType | null)[][] = [
        ['r', 'h', 'e', 'a', 'g', 'a', 'e', 'h', 'r'],
        [null, null, null, null, null, null, null, null, null],
        [null, 'c', null, null, null, null, null, 'c', null],
        ['s', null, 's', null, 's', null, 's', null, 's'],
        [null, null, null, null, null, null, null, null, null] // River
    ];

    // Place Black (Top)
    for(let r=0; r<5; r++) {
        for(let c=0; c<9; c++) {
            const type = setup[r][c];
            if(type) board[r][c] = { type, color: BLACK };
        }
    }
    
    // Place Red (Bottom - Mirror)
    for(let r=0; r<5; r++) {
        for(let c=0; c<9; c++) {
            const type = setup[r][c];
            if(type) board[9-r][c] = { type, color: RED };
        }
    }
}

/**
 * Rendering
 */
function renderGrid(): void {
    const layer = document.getElementById('grid-layer');
    if (!layer) return;

    // Horizontal lines
    for(let i=0; i<10; i++) {
        let el = document.createElement('div');
        el.className = 'h-line';
        el.style.top = (i * CELL_SIZE) + 'px';
        layer.appendChild(el);
    }
    // Vertical lines (split by river)
    for(let i=0; i<9; i++) {
        let el1 = document.createElement('div');
        el1.className = 'v-line';
        el1.style.left = (i * CELL_SIZE) + 'px';
        el1.style.height = (4 * CELL_SIZE) + 'px'; 
        layer.appendChild(el1);

        let el2 = document.createElement('div');
        el2.className = 'v-line';
        el2.style.left = (i * CELL_SIZE) + 'px';
        el2.style.top = (5 * CELL_SIZE) + 'px';
        el2.style.height = (4 * CELL_SIZE) + 'px'; 
        layer.appendChild(el2);
    }
    // Palace X-lines
    drawLine(layer, 3, 0, 5, 2);
    drawLine(layer, 5, 0, 3, 2);
    drawLine(layer, 3, 9, 5, 7);
    drawLine(layer, 5, 9, 3, 7);
}

function drawLine(parent: HTMLElement, c1: number, r1: number, c2: number, r2: number): void {
    const x1 = c1 * CELL_SIZE; const y1 = r1 * CELL_SIZE;
    const x2 = c2 * CELL_SIZE; const y2 = r2 * CELL_SIZE;
    const length = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
    
    const el = document.createElement('div');
    el.className = 'palace-line';
    el.style.width = length + 'px';
    el.style.left = x1 + 'px';
    el.style.top = y1 + 'px';
    el.style.transform = `rotate(${angle}deg)`;
    parent.appendChild(el);
}

function renderPieces(): void {
    const container = document.getElementById('pieces-layer');
    if (!container) return;
    container.innerHTML = '';
    
    for(let r=0; r<BOARD_HEIGHT; r++) {
        for(let c=0; c<BOARD_WIDTH; c++) {
            const p = board[r][c];
            if(p) {
                const el = document.createElement('div');
                el.className = `piece ${p.color === RED ? 'red' : 'black'}`;
                el.innerText = PIECE_TEXT[p.type][p.color];
                el.style.left = (OFFSET + c * CELL_SIZE) + 'px';
                el.style.top = (OFFSET + r * CELL_SIZE) + 'px';
                
                // Interaction
                el.onclick = () => handleSquareClick(r, c);
                
                if (selectedPiece && selectedPiece.r === r && selectedPiece.c === c) {
                    el.classList.add('selected');
                }
                container.appendChild(el);
            } else {
                // Empty square click area
                const ghost = document.createElement('div');
                ghost.style.position = 'absolute';
                ghost.style.width = '40px'; ghost.style.height = '40px';
                ghost.style.left = (OFFSET + c * CELL_SIZE - 20) + 'px';
                ghost.style.top = (OFFSET + r * CELL_SIZE - 20) + 'px';
                ghost.style.cursor = 'pointer';
                ghost.style.zIndex = '5';
                ghost.onclick = () => handleSquareClick(r, c);
                container.appendChild(ghost);
            }
        }
    }
}

function showMoves(moves: Move[]): void {
    const layer = document.getElementById('highlight-layer');
    if (!layer) return;
    layer.innerHTML = '';
    moves.forEach(m => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = (OFFSET + m.c * CELL_SIZE) + 'px';
        dot.style.top = (OFFSET + m.r * CELL_SIZE) + 'px';
        layer.appendChild(dot);
    });
}

function clearHighlights(): void {
    const layer = document.getElementById('highlight-layer');
    if (layer) layer.innerHTML = '';
}

function updateStatus(msg: string): void {
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.innerText = msg;
}

/**
 * Game Logic & Rules
 */

function handleSquareClick(r: number, c: number): void {
    if (gameOver) return;
    if (gameMode === 'pve' && turn === aiColor) return;

    const clickedPiece = board[r][c];

    // Select piece
    if (clickedPiece && clickedPiece.color === turn) {
        selectedPiece = { r, c };
        renderPieces();
        const moves = getValidMoves(r, c, board);
        showMoves(moves);
        return;
    }

    // Move piece
    if (selectedPiece) {
        const moves = getValidMoves(selectedPiece.r, selectedPiece.c, board);
        const validMove = moves.find(m => m.r === r && m.c === c);
        
        if (validMove) {
            executeMove(selectedPiece.r, selectedPiece.c, r, c);
            selectedPiece = null;
            clearHighlights();
            
            if (!gameOver && gameMode === 'pve' && turn === aiColor) {
                setTimeout(aiMove, 100);
            }
        }
    }
}

function executeMove(fromR: number, fromC: number, toR: number, toC: number): void {
    const target = board[toR][toC];
    
    // Check for King capture (End Game)
    if (target && target.type === 'g') {
        gameOver = true;
        renderPieces(); // Render final state
        updateStatus(`Game Over! ${turn === RED ? "紅方" : "黑方"}勝利!`);
        // We perform the move visually
        board[toR][toC] = board[fromR][fromC];
        board[fromR][fromC] = null;
        renderPieces();
        return;
    }

    board[toR][toC] = board[fromR][fromC];
    board[fromR][fromC] = null;
    
    turn = (1 - turn) as PlayerColor;
    renderPieces();
    if(!gameOver) updateStatus(turn === RED ? "紅方回合" : "黑方回合");
}

// ----------------------
// Movement Rules
// ----------------------

function getValidMoves(r: number, c: number, boardState: (Piece | null)[][]): Move[] {
    const piece = boardState[r][c];
    if (!piece) return [];
    
    let moves: Move[] = [];
    const type = piece.type;
    const color = piece.color;

    const addIfValid = (nr: number, nc: number) => {
        if (nr < 0 || nr >= BOARD_HEIGHT || nc < 0 || nc >= BOARD_WIDTH) return;
        const target = boardState[nr][nc];
        if (!target || target.color !== color) {
            moves.push({ r: nr, c: nc });
        }
    };

    if (type === 'g') { // General (King)
        const dr = [-1, 1, 0, 0];
        const dc = [0, 0, -1, 1];
        for (let i = 0; i < 4; i++) {
            const nr = r + dr[i];
            const nc = c + dc[i];
            if (nc >= 3 && nc <= 5) {
                if ((color === RED && nr >= 7 && nr <= 9) || (color === BLACK && nr >= 0 && nr <= 2)) {
                    addIfValid(nr, nc);
                }
            }
        }
        // Flying General (Check vertical line for other King)
        const dir = color === RED ? -1 : 1; // Red looks up, Black looks down
        for(let k=r+dir; k>=0 && k<BOARD_HEIGHT; k+=dir) {
            if(boardState[k][c]) {
                if(boardState[k][c]!.type === 'g') {
                    // Valid flying kill move
                    moves.push({r: k, c: c});
                }
                break;
            }
        }
    }
    
    else if (type === 'a') { // Advisor
        const dr = [-1, 1, -1, 1];
        const dc = [-1, -1, 1, 1];
        for (let i = 0; i < 4; i++) {
            const nr = r + dr[i];
            const nc = c + dc[i];
            if (nc >= 3 && nc <= 5) {
                if ((color === RED && nr >= 7 && nr <= 9) || (color === BLACK && nr >= 0 && nr <= 2)) {
                    addIfValid(nr, nc);
                }
            }
        }
    }
    
    else if (type === 'e') { // Elephant
        const dr = [-2, 2, -2, 2];
        const dc = [-2, -2, 2, 2];
        const blockR = [-1, 1, -1, 1];
        const blockC = [-1, -1, 1, 1];
        
        for (let i = 0; i < 4; i++) {
            const nr = r + dr[i];
            const nc = c + dc[i];
            // Cannot cross river
            if (color === RED && nr < 5) continue;
            if (color === BLACK && nr > 4) continue;
            
            // Check eye blocking
            if (nr >= 0 && nr < BOARD_HEIGHT && nc >= 0 && nc < BOARD_WIDTH) {
                if (!boardState[r + blockR[i]][c + blockC[i]]) {
                    addIfValid(nr, nc);
                }
            }
        }
    }
    
    else if (type === 'h') { // Horse
        const dr = [-2, -2, 2, 2, -1, 1, -1, 1];
        const dc = [-1, 1, -1, 1, -2, -2, 2, 2];
        // Legs to check
        const legR = [-1, -1, 1, 1, 0, 0, 0, 0];
        const legC = [0, 0, 0, 0, -1, -1, 1, 1];

        for (let i = 0; i < 8; i++) {
            const nr = r + dr[i];
            const nc = c + dc[i];
            const lr = r + legR[i];
            const lc = c + legC[i];
            
            if (nr >= 0 && nr < BOARD_HEIGHT && nc >= 0 && nc < BOARD_WIDTH) {
                if (!boardState[lr][lc]) { // Not blocked
                    addIfValid(nr, nc);
                }
            }
        }
    }
    
    else if (type === 'r') { // Rook/Chariot
        const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
        for (let d of dirs) {
            let nr = r + d[0];
            let nc = c + d[1];
            while (nr >= 0 && nr < BOARD_HEIGHT && nc >= 0 && nc < BOARD_WIDTH) {
                if (!boardState[nr][nc]) {
                    moves.push({ r: nr, c: nc });
                } else {
                    if (boardState[nr][nc]!.color !== color) {
                        moves.push({ r: nr, c: nc });
                    }
                    break;
                }
                nr += d[0];
                nc += d[1];
            }
        }
    }
    
    else if (type === 'c') { // Cannon
        const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
        for (let d of dirs) {
            let nr = r + d[0];
            let nc = c + d[1];
            let jumped = false;
            while (nr >= 0 && nr < BOARD_HEIGHT && nc >= 0 && nc < BOARD_WIDTH) {
                if (!boardState[nr][nc]) {
                    if (!jumped) moves.push({ r: nr, c: nc });
                } else {
                    if (!jumped) {
                        jumped = true; // Found screen/platform
                    } else {
                        if (boardState[nr][nc]!.color !== color) {
                            moves.push({ r: nr, c: nc }); // Capture
                        }
                        break;
                    }
                }
                nr += d[0];
                nc += d[1];
            }
        }
    }
    
    else if (type === 's') { // Soldier
        const direction = color === RED ? -1 : 1;
        // Forward
        addIfValid(r + direction, c);
        
        // Sideways (only if crossed river)
        const crossedRiver = (color === RED && r <= 4) || (color === BLACK && r >= 5);
        if (crossedRiver) {
            addIfValid(r, c - 1);
            addIfValid(r, c + 1);
        }
    }

    return moves;
}

/**
 * Advanced AI Implementation
 */

// Piece values
const VAL_GEN = 10000;
const VAL_ROOK = 900;
const VAL_CANNON = 450;
const VAL_HORSE = 400;
const VAL_ELEPHANT = 20;
const VAL_ADVISOR = 20;
const VAL_PAWN = 30;

// Piece-Square Tables (Red perspective: Row 0=Top/Enemy, Row 9=Bottom/Home)
const PST_PAWN = [
    [  9,  9,  9, 11, 13, 11,  9,  9,  9],
    [ 19, 24, 34, 42, 44, 42, 34, 24, 19],
    [ 19, 24, 32, 37, 37, 37, 32, 24, 19],
    [ 19, 23, 27, 29, 30, 29, 27, 23, 19],
    [ 14, 18, 20, 27, 29, 27, 20, 18, 14],
    [  7,  0, 13,  0, 16,  0, 13,  0,  7],
    [  7,  0,  7,  0, 15,  0,  7,  0,  7],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0]
];

const PST_HORSE = [
    [ 4,  8, 16, 12,  4, 12, 16,  8,  4],
    [ 4, 10, 28, 16,  8, 16, 28, 10,  4],
    [12, 14, 23, 25, 25, 25, 23, 14, 12],
    [10, 24, 34, 40, 40, 40, 34, 24, 10],
    [ 6, 16, 26, 36, 36, 36, 26, 16,  6],
    [ 2, 10, 18, 24, 24, 24, 18, 10,  2],
    [ 4,  6, 10, 14, 14, 14, 10,  6,  4],
    [ 0,  4,  8, 10, 10, 10,  8,  4,  0],
    [ 2, -4,  4,  8,  8,  8,  4, -4,  2],
    [ 0, -4,  0,  0,  0,  0,  0, -4,  0]
];

const PST_CANNON = [
    [ 6,  6,  6,  8, 10,  8,  6,  6,  6],
    [ 4,  6,  6,  6,  6,  6,  6,  6,  4],
    [ 2,  4,  4,  4,  8,  4,  4,  4,  2],
    [ 0,  2,  2,  2,  2,  2,  2,  2,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
    [-2,  0,  4,  0,  8,  0,  4,  0, -2],
    [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
    [ 2,  2,  4, 10, 12, 10,  4,  2,  2],
    [ 2,  2,  0,  2,  0,  2,  0,  2,  2],
    [ 0,  0,  0,  0,  0,  0,  0,  0,  0]
];

const PST_ROOK = [
    [14, 14, 12, 18, 16, 18, 12, 14, 14],
    [16, 20, 18, 24, 26, 24, 18, 20, 16],
    [12, 12, 12, 18, 18, 18, 12, 12, 12],
    [12, 18, 16, 22, 22, 22, 16, 18, 12],
    [12, 16, 14, 18, 18, 18, 14, 16, 12],
    [12, 16, 16, 18, 18, 18, 16, 16, 12],
    [ 6, 10, 12, 14, 14, 14, 12, 10,  6],
    [ 4,  8,  8, 14, 14, 14,  8,  8,  4],
    [ 0,  4,  6, 10, 10, 10,  6,  4,  0],
    [-2,  2,  4,  6,  6,  6,  4,  2, -2]
];

function getPstValue(type: PieceType, r: number, c: number, color: PlayerColor): number {
    const row = color === RED ? r : 9 - r;
    const col = c; 
    switch(type) {
        case 's': return PST_PAWN[row][col];
        case 'h': return PST_HORSE[row][col];
        case 'c': return PST_CANNON[row][col];
        case 'r': return PST_ROOK[row][col];
        default: return 0;
    }
}

function aiMove(): void {
    if(gameOver) return;
    
    let depth = 4; 
    if (aiDifficulty === 'easy') depth = 2;
    if (aiDifficulty === 'hard') {
        depth = 5;
        // Dynamic depth for Hard mode
        let pieceCount = 0;
        for(let r=0; r<BOARD_HEIGHT; r++) {
            for(let c=0; c<BOARD_WIDTH; c++) {
                if(board[r][c]) pieceCount++;
            }
        }
        
        if (pieceCount > 28) {
            depth = 4; // Beginning: less depth
        }
        else if (pieceCount < 17) {
            depth = 6; // Endgame: more depth as it's more critical/complicated
        }
    }

    const bestMove = minimaxRoot(depth, aiColor);
    
    if (bestMove) {
        executeMove(bestMove.fromR, bestMove.fromC, bestMove.toR, bestMove.toC);
    } else {
        console.log("AI has no moves");
    }
}

function evaluateBoard(b: (Piece | null)[][], playerColor: PlayerColor): number {
    let score = 0;
    let kingFound = false;
    let opponentKingFound = false;

    for(let r=0; r<BOARD_HEIGHT; r++) {
        for(let c=0; c<BOARD_WIDTH; c++) {
            const p = b[r][c];
            if(p) {
                let val = 0;
                switch(p.type) {
                    case 'g': 
                        val = VAL_GEN; 
                        if (p.color === playerColor) kingFound = true;
                        else opponentKingFound = true;
                        break;
                    case 'r': val = VAL_ROOK; break;
                    case 'c': val = VAL_CANNON; break;
                    case 'h': val = VAL_HORSE; break;
                    case 'e': val = VAL_ELEPHANT; break;
                    case 'a': val = VAL_ADVISOR; break;
                    case 's': val = VAL_PAWN; break;
                }
                val += getPstValue(p.type, r, c, p.color);
                
                // Mobility bonus
                const moves = getValidMoves(r, c, b);
                val += moves.length * 2;

                if (p.color === playerColor) score += val;
                else score -= val;
            }
        }
    }

    if (!kingFound) return -1000000;
    if (!opponentKingFound) return 1000000;

    return score;
}

function minimaxRoot(depth: number, playerColor: PlayerColor): FullMove | undefined {
    const moves = generateAllMoves(board, playerColor);
    
    // Immediate win check (including Flying General)
    for (const move of moves) {
        const target = board[move.toR][move.toC];
        if (target && target.type === 'g') return move;
    }

    let bestVal = -Infinity;
    let bestMove: FullMove | undefined;

    // Sort moves for better pruning (MVV-LVA)
    moves.sort((a, b) => {
        const victim = board[a.toR][a.toC];
        const attacker = board[a.fromR][a.fromC];
        const victimVal = victim ? (PIECE_VALUES_SIMPLE[victim.type] || 0) : 0;
        const attackerVal = attacker ? (PIECE_VALUES_SIMPLE[attacker.type] || 0) : 0;
        
        const scoreA = victimVal * 10 - attackerVal;

        const victimB = board[b.toR][b.toC];
        const attackerB = board[b.fromR][b.fromC];
        const victimValB = victimB ? (PIECE_VALUES_SIMPLE[victimB.type] || 0) : 0;
        const attackerValB = attackerB ? (PIECE_VALUES_SIMPLE[attackerB.type] || 0) : 0;
        
        const scoreB = victimValB * 10 - attackerValB;

        return scoreB - scoreA;
    });

    for (const move of moves) {
        const captured = board[move.toR][move.toC];
        board[move.toR][move.toC] = board[move.fromR][move.fromC];
        board[move.fromR][move.fromC] = null;

        const val = -minimax(depth - 1, -Infinity, Infinity, (1 - playerColor) as PlayerColor);

        board[move.fromR][move.fromC] = board[move.toR][move.toC];
        board[move.toR][move.toC] = captured;

        if (val > bestVal) {
            bestVal = val;
            bestMove = move;
        }
    }
    return bestMove;
}

function minimax(depth: number, alpha: number, beta: number, playerColor: PlayerColor): number {
    if (depth === 0) {
        return evaluateBoard(board, playerColor);
    }

    const moves = generateAllMoves(board, playerColor);
    if (moves.length === 0) return -1000000 - depth; // Loss

    // Sort moves (MVV-LVA)
    moves.sort((a, b) => {
        const victim = board[a.toR][a.toC];
        const attacker = board[a.fromR][a.fromC];
        const victimVal = victim ? (PIECE_VALUES_SIMPLE[victim.type] || 0) : 0;
        const attackerVal = attacker ? (PIECE_VALUES_SIMPLE[attacker.type] || 0) : 0;
        const scoreA = victimVal * 10 - attackerVal;

        const victimB = board[b.toR][b.toC];
        const attackerB = board[b.fromR][b.fromC];
        const victimValB = victimB ? (PIECE_VALUES_SIMPLE[victimB.type] || 0) : 0;
        const attackerValB = attackerB ? (PIECE_VALUES_SIMPLE[attackerB.type] || 0) : 0;
        const scoreB = victimValB * 10 - attackerValB;

        return scoreB - scoreA;
    });

    let maxVal = -Infinity;

    for (const move of moves) {
        const captured = board[move.toR][move.toC];
        
        if (captured && captured.type === 'g') {
             board[move.toR][move.toC] = board[move.fromR][move.fromC];
             board[move.fromR][move.fromC] = null;
             const winScore = 1000000 + depth; 
             board[move.fromR][move.fromC] = board[move.toR][move.toC];
             board[move.toR][move.toC] = captured;
             return winScore;
        }

        board[move.toR][move.toC] = board[move.fromR][move.fromC];
        board[move.fromR][move.fromC] = null;

        const val = -minimax(depth - 1, -beta, -alpha, (1 - playerColor) as PlayerColor);

        board[move.fromR][move.fromC] = board[move.toR][move.toC];
        board[move.toR][move.toC] = captured;

        if (val > maxVal) {
            maxVal = val;
        }
        alpha = Math.max(alpha, val);
        if (alpha >= beta) {
            break;
        }
    }
    return maxVal;
}

const PIECE_VALUES_SIMPLE: Record<PieceType, number> = {
    'g': 10000, 'r': 900, 'c': 450, 'h': 400, 'e': 20, 'a': 20, 's': 30
};

function generateAllMoves(b: (Piece | null)[][], color: PlayerColor): FullMove[] {
    let moves: FullMove[] = [];
    for(let r=0; r<BOARD_HEIGHT; r++) {
        for(let c=0; c<BOARD_WIDTH; c++) {
            const piece = b[r][c];
            if(piece && piece.color === color) {
                let ms = getValidMoves(r, c, b);
                ms.forEach(m => {
                    moves.push({ fromR: r, fromC: c, toR: m.r, toC: m.c });
                });
            }
        }
    }
    return moves;
}

// Start
init();
