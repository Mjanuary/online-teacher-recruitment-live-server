const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors());

const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://165.22.77.142",
    methods: ["GET", "POST"],
  },
});

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

  UPDATED_ROOM_LIST: "UPDATED_ROOM_LIST",

  CAND_REMOVE_EXAM_CLIENT: "CAND_REMOVE_EXAM_CLIENT",
  CAND_REMOVE_EXAM_SERVER: "CAND_REMOVE_EXAM_SERVER",
};

app.get("/liveserver", (req, res) => {
  console.log("visited");
  res.send({ msg: "Welcome to the live server" });
});

// let CANDIDATES = [];

let CANDIDATES = [
  // {
  //   user_id: "",
  //   room_id: "",
  //   peer_id: null,
  // },
];

let ROOM_DETAILS = [
  // {
  //   room_id: ",
  //   start_exam: false,
  //   start_time: "",
  // },
];

io.on("connection", (socket) => {
  console.log("connecting.."); //TODO: to be removed
  console.log("active: ", CANDIDATES.length); //TODO: to be removed

  //******** GET UPDATED ROOM DETAILS ********/
  socket.on(Events.UPDATED_ROOM_LIST, (room_id, SendRooms) => {
    console.log("Sending updated list..."); //TODO: to be removed
    if (room_id !== undefined && room_id !== null) {
      // check if the room exists
      let exists_room = ROOM_DETAILS.find(
        (room_details) => room_details.room_id === room_id
      );

      if (exists_room === undefined) {
        //* Create a new room
        ROOM_DETAILS.push({
          room_id: room_id,
          start_exam: false,
          start_time: null,
        });
      }

      SendRooms({
        candidates: CANDIDATES.filter((itm) => itm.room_id === room_id),
        room:
          exists_room === undefined
            ? {
                room_id: room_id,
                start_exam: false,
                start_time: null,
              }
            : exists_room,
      });
    }
  });

  //**** user Joined the room */
  socket.on("join-room", (data, getTheRoom) => {
    console.log(" ---------- connected: " + data.user_id + " ---> ");

    //* add users to the database
    CANDIDATES.push(data);

    //* join the room
    socket.join(data.room_id);

    // check if the room exist and add it if it doesn't
    let exists_room = ROOM_DETAILS.find(
      (room_details) => room_details.room_id === data.room_id
    );
    let UsersInRoom = CANDIDATES.filter(
      (room) => room.room_id === data.room_id
    );

    if (exists_room === undefined) {
      //* Create a new room
      ROOM_DETAILS.push({
        room_id: data.room_id,
        start_exam: false,
        start_time: null,
      });
      console.log("ROOM CREATED: ", data.room_id); //TODO: to be removed
    } else {
      // Let others users know
      socket.to(data.room_id).emit("user-connected", data);
      console.table(UsersInRoom); //TODO: to be removed
    }

    //* Send the room info
    if (getTheRoom !== undefined) {
      getTheRoom({
        candidates: UsersInRoom,
        room: ROOM_DETAILS.find(
          (room_details) => room_details.room_id === data.room_id
        ),
      });
    }

    //******** START EXAM ********/
    socket.on(Events.START_EXAM_SERVER, (event) => {
      console.log("START EXAM: ", event.room_id); //TODO: to be removed
      if (event.room_id) {
        socket.to(event.room_id).emit(Events.START_EXAM_CLIENT, event);

        //* Update db
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
        console.log("==== STOP EXAM ===="); //TODO: to be removed
        socket.to(event.room_id).emit(Events.STOP_EXAM_CLIENT, event);

        ROOM_DETAILS = ROOM_DETAILS.map((itm) =>
          itm.room_id === event.room_id
            ? {
                ...itm,
                start_exam: false,
              }
            : itm
        );
      }
    });

    //**** user disconnected */
    socket.on("disconnect", () => {
      socket.to(data.room_id).emit("user-disconnected", data.user_id);
      socket.leave(data.room_id);

      // remove user to the room
      CANDIDATES = CANDIDATES.filter((itm) => itm.user_id !== data.user_id);

      console.log("disconnected: " + data.user_id); //TODO: to be removed
      console.table(CANDIDATES); //TODO: to be removed
    });

    //******** CAND_WARNING_EXAM_SERVER EXAM ********/
    socket.on(Events.CAND_WARNING_EXAM_SERVER, (event) => {
      socket.to(event.room_id).emit(Events.CAND_WARNING_EXAM_CLIENT, event);
    });

    //******** CAND_EXAM_EVENT_SERVER EXAM ********/
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

    //******** CAND_STOP_EXAM_SERVER EXAM ********/
    socket.on(Events.CAND_REMOVE_EXAM_SERVER, (event) => {
      if (event.room_id) {
        socket.to(event.room_id).emit(Events.CAND_REMOVE_EXAM_CLIENT, event);
        console.log("CANDIDATE REMOVED INTO EXAM");
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
