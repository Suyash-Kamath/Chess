const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null; // Set this value to "w" or "b" based on the player's role

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

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

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

      boardElement.appendChild(squareElement); // Append the correct DOM element
    });
  });
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q', // Automatically promote to queen
      };
      const result = chess.move(move);

      socket.emit("move",move)
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "\u2659", // Pawn
    r: "\u2656", // Rook
    n: "\u2658", // Knight
    b: "\u2657", // Bishop
    q: "\u2655", // Queen
    k: "\u2654", // King
  };

  return unicodePieces[piece.type] || ""
};

socket.on("playerRole",(role)=>{
    playerRole = role;
    renderBoard();
})

socket.on("spectatorRole",()=>{
    playerRole = null;
    renderBoard();
})

socket.on("boardState",(FEN)=>{
    chess.load(FEN);
    renderBoard();
})
// Socket listener for opponent's move
socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
  });
  
// Ensure to call renderBoard initially
renderBoard();


