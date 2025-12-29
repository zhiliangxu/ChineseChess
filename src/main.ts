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
    updateStatus("Red's Turn");
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
        updateStatus(`Game Over! ${turn === RED ? "Red" : "Black"} Wins!`);
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
    if(!gameOver) updateStatus(turn === RED ? "Red's Turn" : "Black's Turn");
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
        let facingKing = true;
        const dir = color === RED ? -1 : 1; // Red looks up, Black looks down
        for(let k=r+dir; k>=0 && k<BOARD_HEIGHT; k+=dir) {
            if(boardState[k][c]) {
                if(boardState[k][c]!.type === 'g') {
                    // Valid flying kill move
                    moves.push({r: k, c: c});
                }
                facingKing = false; 
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
 * Basic AI (Minimax with Alpha-Beta Pruning)
 */

function aiMove(): void {
    if(gameOver) return;
    
    let depth = 4; // Default Medium
    if (aiDifficulty === 'easy') depth = 2;
    if (aiDifficulty === 'hard') depth = 6;

    const bestMove = minimaxRoot(depth, aiColor);
    
    if (bestMove) {
        executeMove(bestMove.fromR, bestMove.fromC, bestMove.toR, bestMove.toC);
    } else {
        // No moves? Usually means Stalemate or loss
        console.log("AI has no moves");
    }
}

const PIECE_VALUES: Record<PieceType, number> = {
    'g': 10000,
    'r': 90,
    'c': 45,
    'h': 40,
    'e': 20,
    'a': 20,
    's': 10
};

function evaluateBoard(b: (Piece | null)[][], playerColor: PlayerColor): number {
    let score = 0;
    for(let r=0; r<BOARD_HEIGHT; r++) {
        for(let c=0; c<BOARD_WIDTH; c++) {
            const p = b[r][c];
            if(p) {
                let val = PIECE_VALUES[p.type];
                // Slight position bonus for soldiers crossing river
                if (p.type === 's') {
                    if ((p.color === RED && r <= 4) || (p.color === BLACK && r >= 5)) {
                        val += 10; 
                        // Bonus for being close to general
                        if (c >= 3 && c <= 5) val += 10;
                    }
                }
                
                if (p.color === playerColor) score += val;
                else score -= val;
            }
        }
    }
    return score;
}

function minimaxRoot(depth: number, isMaximizingPlayer: number): FullMove | undefined {
    let newGameMoves = generateAllMoves(board, isMaximizingPlayer as PlayerColor);
    let bestMove = -9999;
    let bestMoveFound: FullMove | undefined;

    // Sort moves to improve pruning (captures first)
    newGameMoves.sort((a, b) => {
        const pieceA = board[a.toR][a.toC];
        const pieceB = board[b.toR][b.toC];
        const valA = pieceA ? PIECE_VALUES[pieceA.type] : 0;
        const valB = pieceB ? PIECE_VALUES[pieceB.type] : 0;
        return valB - valA;
    });

    for(let i = 0; i < newGameMoves.length; i++) {
        let move = newGameMoves[i];
        
        // Make move
        let captured = board[move.toR][move.toC];
        board[move.toR][move.toC] = board[move.fromR][move.fromC];
        board[move.fromR][move.fromC] = null;
        
        let value = minimax(depth - 1, -10000, 10000, !isMaximizingPlayer ? aiColor : (1-aiColor) as PlayerColor);
        
        // Undo move
        board[move.fromR][move.fromC] = board[move.toR][move.toC];
        board[move.toR][move.toC] = captured;

        if(value >= bestMove) {
            bestMove = value;
            bestMoveFound = move;
        }
    }
    return bestMoveFound;
}

function minimax(depth: number, alpha: number, beta: number, isMaximizingPlayer: number): number {
    if (depth === 0) {
        return -evaluateBoard(board, aiColor); // Negamax-ish approach simplifies logic
    }

    // Checking if King is missing (Game Over state in tree)
    // For simplicity in this basic AI, we rely on high value of King in evaluation
    
    let newGameMoves = generateAllMoves(board, isMaximizingPlayer ? aiColor : (1-aiColor) as PlayerColor);

    if (isMaximizingPlayer) {
        let bestMove = -9999;
        for (let i = 0; i < newGameMoves.length; i++) {
            let move = newGameMoves[i];
            let captured = board[move.toR][move.toC];
            
            // Optimization: If capturing King, instant win
            if (captured && captured.type === 'g') return 10000 + depth;

            board[move.toR][move.toC] = board[move.fromR][move.fromC];
            board[move.fromR][move.fromC] = null;

            bestMove = Math.max(bestMove, minimax(depth - 1, alpha, beta, !isMaximizingPlayer ? 1 : 0));
            
            board[move.fromR][move.fromC] = board[move.toR][move.toC];
            board[move.toR][move.toC] = captured;

            alpha = Math.max(alpha, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    } else {
        let bestMove = 9999;
        for (let i = 0; i < newGameMoves.length; i++) {
            let move = newGameMoves[i];
            let captured = board[move.toR][move.toC];
            
            if (captured && captured.type === 'g') return -10000 - depth;

            board[move.toR][move.toC] = board[move.fromR][move.fromC];
            board[move.fromR][move.fromC] = null;

            bestMove = Math.min(bestMove, minimax(depth - 1, alpha, beta, !isMaximizingPlayer ? 1 : 0));
            
            board[move.fromR][move.fromC] = board[move.toR][move.toC];
            board[move.toR][move.toC] = captured;

            beta = Math.min(beta, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    }
}

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
