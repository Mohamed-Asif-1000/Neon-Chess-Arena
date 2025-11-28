const boardEl = document.getElementById("board");
const coordsTop = document.getElementById("coordsTop");
const rowLeft = document.getElementById("rowLeft");
const boardWrapperEl = document.querySelector(".board-wrapper"); 
const statusEl = document.getElementById("status");
const capWEl = document.getElementById("capW");
const capBEl = document.getElementById("capB");
const resetBtn = document.getElementById("resetBtn");
const modeSelect = document.getElementById("modeSelect");

let mode = "human"; // "human" or "computer"
let playerColor = "w"; // human color in computer mode
let turn = "w";
let board = [];
let selected = null;
let legalMoves = [];
let captured = { w: [], b: [] };
let enPassantTarget = null;

const files = ["a","b","c","d","e","f","g","h"];
const ranks = [1,2,3,4,5,6,7,8];

const UNICODE = {
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚"
};

let whiteKing = { r: 7, c: 4 };
let blackKing = { r: 0, c: 4 };

// Initialize Board 
function initBoard() {
  board = Array.from({length:8},()=>Array(8).fill(null));
  const back = ["R","N","B","Q","K","B","N","R"];
  for(let c=0;c<8;c++){
    board[0][c]={type:back[c], color:"b", hasMoved:false};
    board[1][c]={type:"P", color:"b", hasMoved:false};
    board[6][c]={type:"P", color:"w", hasMoved:false};
    board[7][c]={type:back[c], color:"w", hasMoved:false};
  }
  turn = "w"; selected = null; legalMoves = []; captured = { w: [], b: [] };
  enPassantTarget = null;
  whiteKing = { r: 7, c: 4 };
  blackKing = { r: 0, c: 4 };
  render();
  updateBoardOrientation(); 

  // If human is black in computer mode, white moves first
  if(mode==="computer" && playerColor==="b") setTimeout(makeComputerMove, 600);
}

// Update Board Orientation
function updateBoardOrientation() {
  const ROTATED_CLASS = 'rotated'; 
  
  if (mode === "human") {
    if (turn === "b") {
      boardWrapperEl.classList.add(ROTATED_CLASS);
    } else {
      boardWrapperEl.classList.remove(ROTATED_CLASS);
    }
  } else {
    if (playerColor === "b") {
      boardWrapperEl.classList.add(ROTATED_CLASS);
    } else {
      boardWrapperEl.classList.remove(ROTATED_CLASS);
    }
  }
}

// Cordinates Building
function buildCoords() {
  coordsTop.innerHTML = "";
  rowLeft.innerHTML = "";
  const filesToShow = files;
  const ranksToShow = [...ranks].reverse();
  filesToShow.forEach(f=>{ const div = document.createElement("div"); div.textContent = f; coordsTop.appendChild(div); });
  ranksToShow.forEach(r=>{ const div = document.createElement("div"); div.textContent = r; rowLeft.appendChild(div); });
}

// Board Rendering
function render() {
  buildCoords();
  boardEl.innerHTML = "";
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const cell = document.createElement("div");
      cell.className = "square "+((r+c)%2===0?"sq-light":"sq-dark");
      cell.dataset.r = r; cell.dataset.c = c;
      const piece = board[r][c];
      if(piece){
        const symbol = piece.color==="w"?UNICODE[piece.type]:UNICODE[piece.type.toLowerCase()];
        const pieceEl = document.createElement("div");
        pieceEl.className = "piece";
        pieceEl.classList.add(piece.color === "w" ? "white" : "black");
        pieceEl.textContent = symbol;
        cell.appendChild(pieceEl);
      }
      cell.addEventListener("click", ()=>onSquareClick(r,c));
      boardEl.appendChild(cell);
    }
  }
  highlightMoves();
  capWEl.textContent = captured.w.join(" ");
  capBEl.textContent = captured.b.join(" ");
  updateGameStatus();
}

// Highlight Moves
function highlightMoves(){
  if(!selected) return;
  legalMoves.forEach(m=>{
    const idx = m.r*8 + m.c;
    const cell = boardEl.children[idx];
    if(board[m.r][m.c]) cell.classList.add("hint-capture");
    else cell.classList.add("hint-move");
  });
  boardEl.children[selected.r*8+selected.c].classList.add("selected");
}

// Click Logic
function onSquareClick(r,c){
  if(mode==="computer" && turn!==playerColor) return;
  const piece = board[r][c];

  if(piece && piece.color === turn){
    selected = {r,c};
    legalMoves = getLegalMoves(r,c);
    render();
    return;
  }

  if(selected){
    const move = legalMoves.find(m=>m.r===r && m.c===c);
    if(move){
      makeMove(selected.r,selected.c,r,c,move.promotion);
      selected=null; legalMoves=[];
      turn = turn==="w"?"b":"w";
      
      //Rotating the Board after every turn
      updateBoardOrientation();
      
      render();

      if(mode==="computer" && turn!==playerColor){
        setTimeout(makeComputerMove, 600);
      }
    }
  }
}

// Check or Check Mate Decision
function isKingInCheck(color, tempBoard=null){
  const b = tempBoard || board;
  const kingPos = color==="w"?whiteKing:blackKing;
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const piece = b[r][c];
      if(piece && piece.color!==color){
        const moves = getPseudoLegalMoves(r,c,piece,b);
        if(moves.some(m=>m.r===kingPos.r && m.c===kingPos.c)) return true;
      }
    }
  }
  return false;
}

function noLegalMoves(color){
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const piece = board[r][c];
      if(piece && piece.color===color){
        if(getLegalMoves(r,c).length>0) return false;
      }
    }
  }
  return true;
}

// Game update Status
function updateGameStatus(){
  statusEl.style.color = "#34495e"; 
    statusEl.textContent = "";
    const inCheck = isKingInCheck(turn);
    const noMoves = noLegalMoves(turn);

    if(inCheck && noMoves){
        // Checkmate
        const loser = turn === 'w' ? 'White' : 'Black';
        const winner = turn === 'w' ? 'Black' : 'White';
        statusEl.textContent = `${loser} is checkmated! ${winner} wins!`;
        statusEl.style.color = "red";
    } else if(inCheck){
        // Just check
        const player = turn === 'w' ? 'White' : 'Black';
        statusEl.textContent = `${player} is in check!`;
        statusEl.style.color = "orange";
    } else if(noMoves){
        // Stalemate
        statusEl.textContent = "Stalemate! It's a draw.";
        statusEl.style.color = "blue";
    } else {
        // Normal move
        statusEl.textContent = turn === 'w' ? "White to move" : "Black to move";
        statusEl.style.color = "#34495e";
    }
}

// Getting the Legal Moves
function getLegalMoves(r,c){
  const moves = getPseudoLegalMoves(r,c,board[r][c],board);
  const safeMoves=[];
  for(const m of moves){
    const tempBoard = board.map(row=>row.map(cell=>cell?{...cell}:null));
    makeMoveOnBoard(tempBoard,r,c,m.r,m.c);
    if(!isKingInCheck(board[r][c].color,tempBoard)) safeMoves.push(m);
  }
  return safeMoves;
}

// Pseudo Moves
function getPseudoLegalMoves(r,c,piece,b){
  const moves=[]; 
  if(!piece) return moves;
  const dirs={R:[[1,0],[-1,0],[0,1],[0,-1]],B:[[1,1],[1,-1],[-1,1],[-1,-1]],Q:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],N:[[2,1],[1,2],[-1,2],[-2,1],[-2,-1],[-1,-2],[1,-2],[2,-1]],K:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]};
  if(piece.type==="P"){
    const fwd = piece.color==="w"?-1:1; 
    const start = piece.color==="w"?6:1;
    if(!b[r+fwd]?.[c]) moves.push({r:r+fwd,c}); 
    if(r===start && !b[r+2*fwd]?.[c] && !b[r+fwd]?.[c]) moves.push({r:r+2*fwd,c});
    for(const dc of [-1,1]){
      const nr=r+fwd,nc=c+dc;
      if(nr>=0 && nr<8 && nc>=0 && nc<8){
        if(b[nr][nc] && b[nr][nc].color!==piece.color) moves.push({r:nr,c:nc});
        else if(enPassantTarget && enPassantTarget.r===nr && enPassantTarget.c===nc) moves.push({r:nr,c:nc});
      }
    }
  } else{
    const isSlide=["R","B","Q"].includes(piece.type);
    dirs[piece.type].forEach(([dr,dc])=>{
      let nr=r+dr,nc=c+dc;
      while(nr>=0 && nr<8 && nc>=0 && nc<8){
        if(!b[nr][nc]) moves.push({r:nr,c:nc});
        else { if(b[nr][nc].color!==piece.color) moves.push({r:nr,c:nc}); break; }
        if(!isSlide) break;
        nr+=dr; nc+=dc;
      }
    });
  }
  return moves;
}

// Board Moves
function makeMoveOnBoard(b,r1,c1,r2,c2){
  const piece = b[r1][c1];
  if(!piece) return;
  if(piece.type==="K"){
    if(piece.color==="w") whiteKing={r:r2,c:c2};
    else blackKing={r:r2,c:c2};
  }
  b[r2][c2]=piece;
  b[r1][c1]=null;
}

// Making the Moves
function makeMove(r1,c1,r2,c2){
  const piece = board[r1][c1];
  const capturedPiece = board[r2][c2];
  if(capturedPiece){
    captured[capturedPiece.color==="w"?"b":"w"].push(
      UNICODE[capturedPiece.color==="w"?capturedPiece.type:capturedPiece.type.toLowerCase()]
    );
  }

  // Capturing En-passant
  if(piece.type==="P" && enPassantTarget && r2===enPassantTarget.r && c2===enPassantTarget.c){
    const capRow = piece.color==="w"?r2+1:r2-1;
    captured[piece.color==="w"?"b":"w"].push(
      UNICODE[board[capRow][c2].color==="w"?board[capRow][c2].type:board[capRow][c2].type.toLowerCase()]
    );
    board[capRow][c2]=null;
  }

  
  if(piece.type==="P" && Math.abs(r2-r1)===2) enPassantTarget={r:(r1+r2)/2,c:c1};
  else enPassantTarget=null;

  piece.hasMoved=true;
  board[r2][c2]=piece;
  board[r1][c1]=null;

  // Updates king position
  if(piece.type==="K"){
    if(piece.color==="w") whiteKing={r:r2,c:c2};
    else blackKing={r:r2,c:c2};
  }

  // Pawns promotion
  if(piece.type==="P" && (r2===0 || r2===7)){
    piece.type="Q"; // auto promote to queen
  }
}

// Computer Moves on the Game Board
function makeComputerMove(){
  const possible=[],capture=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const piece = board[r][c]; if(!piece || piece.color===playerColor) continue;
    getLegalMoves(r,c).forEach(m=>{
      if(board[m.r][m.c] && board[m.r][m.c].color===playerColor) capture.push({from:{r,c},to:m});
      else possible.push({from:{r,c},to:m});
    });
  }
  if(possible.length===0 && capture.length===0){ statusEl.textContent="Game Over"; return; }
  const choice = capture.length>0 ? capture[Math.floor(Math.random()*capture.length)] : possible[Math.floor(Math.random()*possible.length)];
  makeMove(choice.from.r,choice.from.c,choice.to.r,choice.to.c);
  turn=playerColor;
  updateBoardOrientation();
  render();
}

// Selecting the available Mode
modeSelect.addEventListener("change", e=>{
  const val = e.target.value;
  if(val==="human") mode="human";
  else if(val==="computer-w"){ mode="computer"; playerColor="w"; }
  else if(val==="computer-b"){ mode="computer"; playerColor="b"; }
  initBoard();
});

// Resetting the Board
resetBtn.addEventListener("click", initBoard);
// Starting the Game
initBoard();