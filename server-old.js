const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Events = require("./src/events");
const logger = require("./src/logger");
const Redis = require("redis");
const { stringify } = require("querystring");
const { DEFAULT_EXPIRATION, SERVER_PORT, SERVER_URL } = require("./src/config");
// const client = Redis.createClient({url: ""})
const redisClient = Redis.createClient();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: SERVER_URL,
    methods: ["GET", "POST"],
  },
});

let data = [
  { name: "janvier", stack: "Front & Backend" },
  { name: "Gabin", stack: "Front & Backend" },
  { name: "Joseph", stack: "Backend" },
  { name: "Emmy", stack: "Front" },
  { name: "Patrick", stack: "Front" },
];

app.get("/live-server", (req, res) => {
  redisClient.setex("photos", DEFAULT_EXPIRATION, JSON.stringify(data));
  logger.info("visited");
  res.send({ msg: "Welcome to the live server" });
});

app.get("/get-data", (req, res) => {
  redisClient.get("photos", (error, photos) => {
    if (error) logger.error(error);
    if (error) console.log(error);
    console.log({
      error,
      photos,
    });
    if (photos !== null) {
      res.send(photos);
    } else {
      res.send({ msg: "No data found" });
    }
  });
});

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

let BLOCKED_CANDIDATES = [
  // string
];

// Data structure
let data_structure = {
  room_id: {
    room_id: "",
    start_exam: "",
    start_time: "",
    room_id: "",
    candidates: [
      {
        user_id: "",
        peer_id: "",
        blocked: false,
        active: false,
        joined: false,
        done: false,
        super: false,
      },
    ],
  },
};

io.on("connection", (socket) => {
  logger.info("connecting.."); //TODO: to be removed
  logger.info("active: ", CANDIDATES.length); //TODO: to be removed

  //******** GET UPDATED ROOM DETAILS ********/
  socket.on(Events.UPDATED_ROOM_LIST, (room_id, SendRooms) => {
    logger.info("Sending updated list..."); //TODO: to be removed
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
    // logger.info(" ---------- connected: " + data.user_id + " ---> ");

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
      logger.info("ROOM CREATED: ", data.room_id); //TODO: to be removed
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
        blocked: BLOCKED_CANDIDATES.indexOf(data.user_id) >= 0 ? true : false,
      });
    }
  });

  //! xfdfdfdfdd

  //******** START EXAM ********/
  socket.on(Events.START_EXAM_SERVER, (event) => {
    logger.info("START EXAM: ", event.room_id); //TODO: to be removed
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
      logger.info("==== STOP EXAM ===="); //TODO: to be removed
      socket.to(event.room_id).emit(Events.STOP_EXAM_CLIENT, event);

      //* Remove the blocked users into the arrays
      BLOCKED_CANDIDATES.forEach((client) => {});

      //* Remove the room

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

    logger.info("disconnected: " + data.user_id); //TODO: to be removed
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
      logger.info("CANDIDATE REMOVED INTO EXAM");
    }
  });

  // //******** CAND_WARNING_EXAM_SERVER EXAM ********/
  socket.on(Events.CAND_RESTART_EXAM_SERVER, (event) => {
    if (event.room_id) {
      socket.to(event.room_id).emit(Events.CAND_RESTART_EXAM_CLIENT, event);
    }
  });
});

// server.listen(SERVER_PORT);
// logger.error("Error");
// logger.warn("Warn");
// logger.info("info");
// logger.verbose("verbose");
// logger.debug("debug");
// logger.silly("silly");
// logger.silly(2323);

function getSetData(key, cb) {
  return new Promise((resolver, reject) => {
    redisClient.get(key, (error, data) => {
      if (error) return reject;
    });
  });
}

server.listen(SERVER_PORT, () => {
  // logger.info(`App listening at ${SERVER_URL}:${SERVER_PORT}`);
  logger.info(`Socket Server is running on port ${SERVER_PORT}`);
});
// peerjs --port 3001
