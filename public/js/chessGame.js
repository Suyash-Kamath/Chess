const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null; // Player's role: 'w', 'b', or null for spectator

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );

        pieceElement.innerText = getPieceUnicode(square); // Add piece Unicode
        pieceElement.draggable = playerRole === square.color;

        // Drag start event
        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", ""); // Required for drag-and-drop to work
          }
        });

        // Drag end event
        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      // Allow drop on empty or occupied squares
      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      // Drop event to handle moves
      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row, 10),
            col: parseInt(squareElement.dataset.col, 10),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q", // Automatically promote to queen
  };

  // Validate move before sending to server
  const result = chess.move(move);
  if (result) {
    socket.emit("move", move); // Send move to the server
    renderBoard();
  } else {
    console.log("Invalid move:", move);
  }
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: { w: "\u2659", b: "\u265F" }, // Pawn
    r: { w: "\u2656", b: "\u265C" }, // Rook
    n: { w: "\u2658", b: "\u265E" }, // Knight
    b: { w: "\u2657", b: "\u265D" }, // Bishop
    q: { w: "\u2655", b: "\u265B" }, // Queen
    k: { w: "\u2654", b: "\u265A" }, // King
  };

  return unicodePieces[piece.type][piece.color];
};

// Socket event listeners
socket.on("playerRole", (role) => {
  playerRole = role; // Set player role ('w' or 'b')
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null; // Spectator cannot move pieces
  renderBoard();
});

socket.on("boardState", (FEN) => {
  chess.load(FEN); // Load board state from server
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move); // Update board with opponent's move
  renderBoard();
});

// Initial render
renderBoard();
