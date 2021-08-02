const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());

const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let USERS_DB = [];

let Events = {
  START_EXAM_CLIENT: "START_EXAM_CLIENT",
  START_EXAM_SERVER: "START_EXAM_SERVER",

  STOP_EXAM_CLIENT: "STOP_EXAM_CLIENT",
  STOP_EXAM_SERVER: "STOP_EXAM_SERVER",

  CAND_EVENT_CLIENT: "CAND_EVENT_CLIENT",
  CAND_EVENT_SERVER: "CAND_EVENT_SERVER",

  CAND_CONTINUE_EXAM_SERVER: "CAND_CONTINUE_EXAM_SERVER",
  CAND_CONTINUE_EXAM_CLIENT: "CAND_CONTINUE_EXAM_CLIENT",

  CAND_STOP_EXAM_CLIENT: "CAND_STOP_EXAM_CLIENT",
  CAND_STOP_EXAM_SERVER: "CAND_STOP_EXAM_SERVER",

  CAND_RESTART_EXAM_CLIENT: "CAND_RESTART_EXAM_CLIENT",
  CAND_RESTART_EXAM_SERVER: "CAND_RESTART_EXAM_SERVER",

  ALL_CAND_RESTART_EXAM_CLIENT: "ALL_CAND_RESTART_EXAM_CLIENT",
  ALL_CAND_RESTART_EXAM_SERVER: "ALL_CAND_RESTART_EXAM_SERVER",

  CAND_WARNING_EXAM_CLIENT: "CAND_WARNING_EXAM_CLIENT",
  CAND_WARNING_EXAM_SERVER: "CAND_WARNING_EXAM_SERVER",

  CAND_BRODCAST_MSG_CLIENT: "CAND_BRODCAST_MSG_CLIENT",
  CAND_BRODCAST_MSG_SERVER: "CAND_BRODCAST_MSG_SERVER",

  CAND_PRIVATE_MSG_CLIENT: "CAND_PRIVATE_MSG_CLIENT",
  CAND_PRIVATE_MSG_SERVER: "CAND_PRIVATE_MSG_SERVER",

  CAND_EXAM_EVENT_CLIENT: "CAND_EXAM_EVENT_CLIENT",
  CAND_EXAM_EVENT_SERVER: "CAND_EXAM_EVENT_SERVER",
};

const { v4: uuidV4 } = require("uuid");

app.get("/", (req, res) => {
  console.log("visited");
  res.send({ msg: "Welcome to the live server" });
});

let CANDIDATES = [
  {
    user_id: "s98d7f0s9df7-0s98df0s98df0s9d8f-0s98df0s9d8f",
    email: "janvier@gmail.com",
    username: "Janvier",
    first_name: "Muhawenimana",
    last_name: "Janvier",
    muted: true,
    active: false,
    completed: false,
    type: "supervisor",
    room_id: "janvier-room",
    peer_id: null,
  },
  {
    user_id: "rt80ewt8e9t8-0e9r8t0e9r8t-0er98t0er98t0er",
    email: "alice@gmail.com",
    username: "Alice",
    first_name: "MAHORO",
    last_name: "Alice",
    muted: true,
    active: false,
    completed: false,
    type: "candidate",
    room_id: "janvier-room",
    peer_id: null,
  },
  {
    user_id: "s098f0sd98f-sdf0sd8fds9f8-9sd87f0sd89f0s",
    email: "james@gmail.com",
    username: "James",
    first_name: "MUKIZA",
    last_name: "James",
    muted: true,
    active: false,
    completed: false,
    type: "candidate",
    // type: "supervisor",
    room_id: "janvier-room",
    peer_id: null,
  },
  {
    user_id: "s98dr0ws98r0er-s8d7f9s80df09sdf-s98d7f09",
    email: "joseph@gmail.com",
    username: "Joseph",
    first_name: "SHYIRAMBERE",
    last_name: "Joseph",
    muted: true,
    active: false,
    completed: true,
    type: "candidate",
    room_id: "janvier-room",
    peer_id: null,
  },
  {
    user_id: "9s8d7f9s78df98-8sdf089sd0f98-987sdf89sd7f",
    email: "emmy@gmail.com",
    username: "Emmy",
    first_name: "MAHORO",
    last_name: "EMMY",
    muted: true,
    active: false,
    completed: false,
    type: "candidate",
    room_id: "janvier-room",
    peer_id: null,
  },
  {
    user_id: "98234732847329-923874923874-9238749823749",
    email: "jonathan@gmail.com",
    username: "Jonathan",
    first_name: "HAKIZIMANA",
    last_name: "Jonathan",
    muted: true,
    active: false,
    completed: true,
    type: "candidate",
    room_id: "janvier-room",
    peer_id: null,
  },
  {
    user_id: "9sd87f9s8ds9d87f-9s87df98sdf7-9s8d7f9s8d7f",
    email: "gabin@gmail.com",
    username: "Gabin",
    first_name: "ISHIMWE",
    last_name: "Jean Gabin",
    muted: true,
    active: false,
    completed: false,
    type: "candidate",
    room_id: "janvier-room",
    peer_id: null,
  },
  {
    user_id: "s9d8f7s9df7s9f-9s78fd9s8d7f9s8f-9s87df9s8d",
    email: "manzi@gmail.com",
    username: "Alexi",
    first_name: "MANZI",
    last_name: "Alexi",
    muted: true,
    active: false,
    completed: false,
    type: "candidate",
    room_id: "janvier-room",
    peer_id: null,
  },
  {
    user_id: "9s8f7sd98f7sdf-s98d7fs09df70sdg-k2b9fg87hg9f7h",
    email: "jojo@gmail.com",
    username: "jojo",
    first_name: "UWIMANA",
    last_name: "John",
    muted: true,
    active: false,
    completed: false,
    type: "candidate",
    room_id: "janvier-room",
    peer_id: null,
  },
  {
    user_id: "0s98df0df8ss0d98f-0s98df0s97f-8s67df98s7df99sd87f",
    email: "jado@gmail.com",
    username: "Jado",
    first_name: "NIYONKURU",
    last_name: "Jado",
    muted: false,
    active: false,
    completed: false,
    type: "candidate",
    room_id: "janvier-room",
    peer_id: null,
  },
];
let ROOM_DETAILS = [
  {
    name: "Janvier-room",
    room_id: "janvier-room",
    video_support: false,
    start_exam: false,
    start_time: "",
    end_time: "",
    exam_done: false,
  },
];

app.get("/api/room-members/:roomId", (req, res) => {
  res.send(CANDIDATES.filter((itm) => itm.room_id === req.params.roomId));
});

app.post("/api/login", (req, res) => {
  // res.send(CANDIDATES.filter((itm) => itm.room_id === req.params.roomId));
  // console.log("LOGIN: " + req.body.email);
  const email = req.body.email;
  const user = CANDIDATES.find((itm) => itm.email === email);

  if (user === undefined) {
    return res.send({
      found: false,
      user: null,
      room: ROOM_DETAILS[0],
    });
  }
  return res.send({
    found: true,
    user: user,
    room: ROOM_DETAILS[0],
  });
});

io.on("connection", (socket) => {
  console.log("connecting..");
  console.log("active: ", USERS_DB.length);

  //**** user Joined the room */
  socket.on("join-room", (data, getTheRoom) => {
    console.log(" ---------- connected: " + data.user_id + " ---> ");

    //* add users to the database
    USERS_DB.push(data);
    console.log("active: ", USERS_DB.length);

    //* join the room
    socket.join(data.room_id);
    socket.to(data.room_id).emit("user-connected", data);
    console.log(USERS_DB);

    if (getTheRoom !== undefined) {
      getTheRoom(USERS_DB.filter((itm) => itm.room_id === data.room_id));
    }

    //******** START EXAM ********/
    socket.on(Events.START_EXAM_SERVER, (event) => {
      console.log("START EXAM");
      if (event.room_id) {
        socket.to(event.room_id).emit(Events.START_EXAM_CLIENT, event);

        ROOM_DETAILS = ROOM_DETAILS.map((itm) =>
          itm.room_id === event.room_id
            ? {
                ...itm,
                start_exam: true,
                start_time: new Date().toDateString(),
              }
            : itm
        );
      }
    });

    //******** STOP EXAM ********/
    socket.on(Events.STOP_EXAM_SERVER, (event) => {
      if (event.room_id) {
        console.log("==== STOP EXAM");
        socket.to(event.room_id).emit(Events.STOP_EXAM_CLIENT, event);

        ROOM_DETAILS = ROOM_DETAILS.map((itm) =>
          itm.room_id === event.room_id
            ? {
                ...itm,
                start_exam: false,
                exam_done: true,
                end_time: new Date().toDateString(),
              }
            : itm
        );
      }
    });

    //**** user disconnected */
    socket.on("disconnect", () => {
      socket.to(data.room_id).emit("user-disconnected", data.user_id);
      console.log("disconnected: " + data.user_id);
      socket.leave(data.room_id);

      //* remove the user to the database
      if (data.user_id === "s98d7f0s9df7-0s98df0s98df0s9d8f-0s98df0s9d8f") {
        USERS_DB = [];
      } else {
        USERS_DB = USERS_DB.filter((itm) => itm.user_id !== data.user_id);
      }
      console.log("active: ", USERS_DB.length);
    });

    //******** START EXAM ********/
    socket.on(Events.START_EXAM_SERVER, (event) =>
      socket.to(event.room_id).emit(Events.START_EXAM_CLIENT, event)
    );

    //******** STOP EXAM ********/
    socket.on(Events.STOP_EXAM_SERVER, (event) =>
      socket.to(event.room_id).emit(Events.STOP_EXAM_CLIENT, event)
    );

    //******** STOP EXAM ********/
    socket.on(Events.CAND_WARNING_EXAM_SERVER, (event) => {
      socket.to(event.room_id).emit(Events.CAND_WARNING_EXAM_CLIENT, event);
    });

    //******** STOP EXAM ********/
    socket.on(Events.CAND_EXAM_EVENT_SERVER, (event) => {
      if (event.room_id) {
        socket.to(event.room_id).emit(Events.CAND_EXAM_EVENT_CLIENT, event);
      }
    });

    //******** CAND_CONTINUE_EXAM_SERVER EXAM ********/
    socket.on(Events.CAND_CONTINUE_EXAM_SERVER, (event) => {
      if (event.room_id) {
        socket.to(event.room_id).emit(Events.CAND_CONTINUE_EXAM_CLIENT, event);
      }
    });

    //******** CAND_STOP_EXAM_SERVER EXAM ********/
    socket.on(Events.CAND_STOP_EXAM_SERVER, (event) => {
      if (event.room_id) {
        socket.to(event.room_id).emit(Events.CAND_STOP_EXAM_CLIENT, event);
      }
    });

    // //******** CAND_WARNING_EXAM_SERVER EXAM ********/
    socket.on(Events.CAND_RESTART_EXAM_SERVER, (event) => {
      if (event.room_id) {
        socket.to(event.room_id).emit(Events.CAND_RESTART_EXAM_CLIENT, event);
      }
    });
  });
});

server.listen(5000);
// peerjs --port 3001
