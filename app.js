const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = socket(server);

const chess = new Chess();

let players = {};

let currentPlayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
  console.log("connected");

  // uniquesocket.on('disconnect',()=>{
  //   console.log('Disconnected');

  // })

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "W");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "B");
  } else {
    uniquesocket.emit("spectatorRole");
  }

  uniquesocket.on("disconnect", () => {
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });

  uniquesocket.on("move",(move)=>{
        try {
            if(chess.turn()==='W' && uniquesocket.id!=players.white) return;
            if(chess.turn()==='B' && uniquesocket.id!=players.black) return;

            const result=chess.move(move)
            if(result){
                currentPlayer = chess.turn(); //kiska turn hai abhi , black ya white
                io.emit("move",move) // sabko bhej rahe hai
                io.emit("boardState",chess.fen());
            }
            else{
              console.log("Invalid move ",move);
              uniquesocket.emit("invalidMove",move)
              
            }


        } catch (error) {
            console.log(error.message);
            uniquesocket.emit("invalidMove",move)
            
        }
  })

});



server.listen(3000, () => {
  console.log(`Listening on port 3000`);
});
