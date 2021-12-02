const express = require("express");
const cors = require("cors");
const Events = require("./src/events");
const logger = require("./src/logger");
const Redis = require("redis");
const { DEFAULT_EXPIRATION, SERVER_PORT, SERVER_URL } = require("./src/config");
const { createCandidate, createNewRoom } = require("./src/functions");

// const client = Redis.createClient({url: ""})
const redisClient = Redis.createClient({
  port: 6379,
  host: "localhost",
  password: "xcoder",
});

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

/**
 * Update the candidate details
 * @param {*} room_id
 * @param {*} data
 */
const updateCandidateDetails = (room_id, data) => {
  redisClient.get(room_id, (error, room) => {
    if (error) logger.error(error);

    if (room !== null) {
      let newRoom = { ...JSON.parse(room) };
      let updatedCandidates = newRoom.candidates.map((candid) =>
        candid.user_id === data.user_id ? { ...candid, ...data } : candid
      );
      newRoom.candidates = updatedCandidates;

      // Update room
      redisClient.setex(room_id, DEFAULT_EXPIRATION, JSON.stringify(newRoom));
    } else {
      logger.info("updateCandidateDetails: No room found!");
    }
  });
};

/**
 * Update the data on the room only
 * @param {*} room_id
 * @param {*} data
 */
const updateRoomOptions = (room_id, data) => {
  redisClient.get(room_id, (error, room) => {
    if (error) logger.error(error);

    if (room !== null) {
      let newRoom = { ...JSON.parse(room), ...data };
      // Update room
      redisClient.setex(room_id, DEFAULT_EXPIRATION, JSON.stringify(newRoom));
    } else {
      logger.info("updateRoomOptions: No room found!");
    }
  });
};

// Redis errors
redisClient.on("error", (error) => logger.error(error));

app.get("/live-server", (req, res) => {
  // redisClient.setex("photos", DEFAULT_EXPIRATION, JSON.stringify("data"));
  // logger.info("visited");
  res.send({ msg: "Welcome to the live server" });
});

io.on("connection", (socket) => {
  logger.info("connecting..");

  /**
   * @action //*JOIN_ROOM_CANDIDATE_SERVER
   * @description This will add the candidate to the room once they are on the attendance
   */
  socket.on("join-room", (data, callBack) => {
    const { user_id, room_id, supper, exam_id } = data;

    // 1 check if the room exists
    redisClient.get(room_id, (error, room) => {
      if (error) {
        // Handle error
        return callBack({
          error: true,
          msg: "Failed to get connect to room",
          data: null,
        });
      }

      // 2 check if the user is on the list
      if (room !== null) {
        let RoomData = JSON.parse(room); // get room
        // check the exam_id
        if (RoomData.exam_id !== exam_id) {
          return callBack({
            error: true,
            msg: `Your exam does not match the current active exam in this room`,
            data: null,
          });
        }

        // Add the supervisor to the room
        if (supper !== undefined && supper === true) {
          logger.info("SUPERVISOR JOINED THE ROOM");

          socket.join(room_id);
          return callBack({
            error: false,
            msg: "Joined the room",
            data: { user_id, room_id, supper },
          });
        }

        // check if the user exist on the room
        let userIsOnList = RoomData.candidates.find(
          (candid) => candid.user_id === user_id
        );

        if (userIsOnList === undefined) {
          return callBack({
            error: true,
            msg: `You are not on the attendance of Group: ${RoomData.group_id}`,
            data: null,
          });
        } else {
          //* User is on the list
          // 1 Join user to socket (Room)
          socket.join(room_id);

          // RoomData
          let candidate_blocked = false;
          // Check if the candidate is logged in for the first time
          if (userIsOnList.joined === false) {
            candidate_blocked = false;
          } else {
            candidate_blocked = RoomData.rule === true ? false : true;
          }

          // 2 Send the JOIN event to the room
          socket.to(room_id).emit(Events.NEW_USER_JOINED_CLIENT, {
            ...userIsOnList,
            joined: true,
            stopped: candidate_blocked,
          });
          logger.info(`${user_id} Joined the room: ${room_id}`);

          // 3 activate the candidate on the list
          updateCandidateDetails(room_id, {
            user_id: user_id,
            active: true,
            joined: true,
            stopped: candidate_blocked,
          });

          //! the changes goes here
          let candidate_timer = {
            start_time: "",
            duration: 0,
            minutes: userIsOnList.added_minutes,
          };

          // check if there is some added minutes
          if (userIsOnList.added_minutes !== 0) {
            candidate_timer.start_time = userIsOnList.start_added_time;
            candidate_timer.duration = userIsOnList.duration;
          } else {
            candidate_timer.start_time = RoomData.start_time;
            candidate_timer.duration = RoomData.duration;
          }

          // Return the data with the callback
          return callBack({
            error: false,
            msg: "You joined the room successfully!",

            data: {
              ...RoomData,
              candidate_timer: candidate_timer,
              user: {
                ...userIsOnList,
                active: true,
                joined: true,
                stopped: candidate_blocked,
              },
            },
          });
        }
      } else {
        logger.info(`Room is not yet started!`);
        return callBack({
          error: true,
          msg: "Room is not yet started!",
          data: null,
        });
      }
    });

    // Disconnect
    //**** user disconnected */
    socket.on("disconnect", () => {
      socket.to(data.room_id).emit("user-disconnected", data.user_id);
      socket.leave(data.room_id);

      updateCandidateDetails(data.room_id, {
        user_id: data.user_id,
        active: false,
        stopped: true,
      });
    });
  });

  /**
   * @action //*JOIN_ROOM_SUPERVISOR_SERVER
   * @description This will join a supervisor and add them to the list automatically once they are not on the list
   */
  socket.on(Events.JOIN_ROOM_SUPERVISOR_SERVER, (user_data, callBack) => {
    const { user_id, room_id } = user_data;

    // 1 check if the room exists
    redisClient.get(room_id, (error, room) => {
      if (error) {
        // Handle error
        logger.error(error);

        logger.info("Failed to get connect to room");
        return callBack({
          error: true,
          msg: "Failed to get connect to room",
          data: null,
        });
      }

      // 2 check if the user is on the list
      if (room !== null) {
        let RoomData = JSON.parse(room); // get room

        // 1 Join user to socket (Room)
        //// socket.join(room_id);

        // 2 Send the JOIN event to the room
        socket.to(room_id).emit(Events.NEW_USER_JOINED_CLIENT, userIsOnList);

        // check if the user exist on the room
        let userIsOnList = RoomData.candidates.find(
          (candid) => candid.user_id === user_id
        );

        let newRoom = null;
        if (userIsOnList === undefined) {
          // Add user to the room
          newRoom = {
            ...RoomData,
            candidates: [
              ...RoomData.candidates,
              createCandidate(user_id, room_id, false, "", true, 0),
            ],
          };
          //* Add new user to the database
          redisClient.setex(
            room_id,
            DEFAULT_EXPIRATION,
            JSON.stringify(newRoom)
          );

          userIsOnList = createCandidate(user_id, room_id, "", true);
        } else {
          newRoom = RoomData;
        }

        logger.info("You joined the room successfully!");
        return callBack({
          error: false,
          msg: "You joined the room successfully!",
          data: {
            ...newRoom,
            user: userIsOnList,
          },
        });
      } else {
        logger.info("Room is not yet started!");
        return callBack({
          error: true,
          msg: "Room is not yet started!",
          data: null,
        });
      }
    });
  });

  /**
   * @action //*CREATE_ROOM_SERVER
   * @description Create the new room of the candidate
   */
  socket.on(
    Events.CREATE_ROOM_SERVER,
    (
      {
        candidates,
        room_id,
        user_id,
        group_id,
        stop_candidate_when_comeback,
        exam_id,
        duration,
      },
      callBack
    ) => {
      // 1 create the room_data
      let Room = createNewRoom(
        room_id,
        group_id,
        candidates,
        stop_candidate_when_comeback,
        exam_id,
        duration
      );
      let candidates_list = [
        ...candidates.map((cand, seat_number) =>
          createCandidate(room_id, cand, false, "", false, seat_number + 1)
        ),
        createCandidate(room_id, user_id, true, "", true),
      ];

      Room.candidates = candidates_list; // Add candidates to the list

      // 2 join the current user to the room (socket)
      // socket.join(room_id);

      // 3 add data to redis
      redisClient.setex(room_id, DEFAULT_EXPIRATION, JSON.stringify(Room));
      //
      logger.info("Room created");
      return callBack({
        error: false,
        msg: "New room created",
        data: Room,
      });
    }
  );

  /**
   * @action //*GET_ROOM_INFO_SERVER
   * @description Send the details of the room
   */
  socket.on(Events.GET_ROOM_INFO_SERVER, (room_id, callBack) => {
    // 1 check if the room exists
    redisClient.get(room_id, (error, room) => {
      if (error) {
        // Handle error
        logger.error(error);
        return callBack({
          error: true,
          msg: "Failed to get connect to room",
          data: null,
        });
      }

      // 2 check if the user is on the list
      if (room !== null) {
        let RoomData = JSON.parse(room); // get room

        logger.info("ROOM DETAILS");
        logger.info(RoomData);
        return callBack({
          error: false,
          msg: "Room details",
          data: RoomData,
        });
      } else {
        logger.info("ROOM DETAILS");
        return callBack({
          error: true,
          msg: "Room is not yet started!",
          data: null,
        });
      }
    });
  });

  //******** START EXAM ********/
  socket.on(Events.START_EXAM_SERVER, (event, callBack) => {
    if (event.room_id) {
      // let StartTime = new Date().toString();
      let StartTime = new Date().toLocaleString("en-US", {
        timeZone: "Africa/Kigali",
      });

      socket.to(event.room_id).emit(Events.START_EXAM_CLIENT, event, {
        start_time: StartTime,
        duration: event.duration,
      });

      //* Update db
      updateRoomOptions(event.room_id, {
        start_exam: true,
        start_time: StartTime,
        duration: event.duration,
      });
      logger.info("ROOM DONE EXAM");
      callBack({ start_time: StartTime, duration: event.duration });
    }
  });

  //******** STOP EXAM ********/
  socket.on(Events.STOP_EXAM_SERVER, (event) => {
    if (event.room_id) {
      socket.to(event.room_id).emit(Events.STOP_EXAM_CLIENT, event);

      //* Update db
      updateRoomOptions(event.room_id, {
        start_exam: false,
        // start_time: new Date().toDateString(),
        exam_done: true,
      });
      logger.info("ROOM STOP EXAM");
    }
  });

  //******** STOP EXAM ********/
  socket.on(Events.DELETE_ROOM_SERVER, (event, callbackFunction) => {
    if (event.room_id) {
      redisClient.del(event.room_id, function (err, response) {
        if (response == 1) {
          logger.info(`DELETE ROOM: ${event.room_id}`);
          callbackFunction(true);
        } else {
          logger.info(`CAN NOT DELETE THE ROOM`);
          callbackFunction(false);
        }
      });
    }
  });

  //******** CAND_WARNING_EXAM_SERVER EXAM ********/
  socket.on(Events.CAND_WARNING_EXAM_SERVER, (event) => {
    socket.to(event.room_id).emit(Events.CAND_WARNING_EXAM_CLIENT, event);
  });

  //******** CAND_EXAM_EVENT_SERVER EXAM ********/
  socket.on(Events.CAND_EXAM_EVENT_SERVER, (event) => {
    if (event.room_id) {
      socket.to(event.room_id).emit(Events.CAND_EXAM_EVENT_CLIENT, event);

      updateCandidateDetails(event.room_id, {
        user_id: event.user_id,
        stopped: true,
      });
    }
  });

  //******** EXAM_DONE_SERVER EXAM ********/
  socket.on(Events.EXAM_DONE_SERVER, (event) => {
    if (event.room_id) {
      socket.to(event.room_id).emit(Events.EXAM_DONE_CLIENT, event);

      updateCandidateDetails(event.room_id, {
        user_id: event.user_id,
        done: true,
        joined: true,
      });
    }
  });

  //******** USER_DISCONNECTED_ONLINE_SERVER EXAM ********/
  socket.on(Events.USER_DISCONNECTED_ONLINE_SERVER, (event) => {
    if (event.room_id) {
      // socket.to(event.room_id).emit(Events.USER_DISCONNECTED_ONLINE_CLIENT, event);
      socket.to(event.room_id).emit("user-disconnected", event.user_id);
      socket.leave(event.room_id);

      updateCandidateDetails(event.room_id, {
        user_id: event.user_id,
        active: false,
        joined: true,
      });
    }
  });

  //******** CAND_CONTINUE_EXAM_SERVER EXAM ********/
  socket.on(Events.CAND_CONTINUE_EXAM_SERVER, (event) => {
    if (event.room_id) {
      socket.to(event.room_id).emit(Events.CAND_CONTINUE_EXAM_CLIENT, event);
      updateCandidateDetails(event.room_id, {
        user_id: event.user_id,
        stopped: false,
      });
      logger.info("CANDIDATE CONTINUE EXAM");
    }
  });

  //******** CAND_STOP_EXAM_SERVER EXAM ********/
  socket.on(Events.CAND_STOP_EXAM_SERVER, (event) => {
    if (event.room_id) {
      socket.to(event.room_id).emit(Events.CAND_STOP_EXAM_CLIENT, event);
      updateCandidateDetails(event.room_id, {
        user_id: event.user_id,
        stopped: true,
      });
      logger.info("CANDIDATE STOP EXAM");
    }
  });

  //******** CAND_STOP_EXAM_SERVER EXAM ********/
  socket.on(Events.CAND_REMOVE_EXAM_SERVER, (event) => {
    if (event.room_id) {
      socket.to(event.room_id).emit(Events.CAND_REMOVE_EXAM_CLIENT, event);
      updateCandidateDetails(event.room_id, {
        user_id: event.user_id,
        removed: true,
      });
      logger.info("CANDIDATE REMOVED INTO EXAM");
    }
  });

  // //******** CAND_WARNING_EXAM_SERVER EXAM ********/
  socket.on(Events.CAND_RESTART_EXAM_SERVER, (event) => {
    if (event.room_id) {
      socket.to(event.room_id).emit(Events.CAND_RESTART_EXAM_CLIENT, event);
      updateCandidateDetails(event.room_id, {
        user_id: event.user_id,
        stopped: false,
      });
      logger.info("CANDIDATE EXAM RESTARTED EXAM");
    }
  });

  //******** CAND_STOP_EXAM_SERVER EXAM ********/
  socket.on(Events.CAND_DONE_EXAM_SERVER, (event) => {
    if (event.room_id) {
      socket.to(event.room_id).emit(Events.CAND_DONE_EXAM_CLIENT, event);
      updateCandidateDetails(event.room_id, {
        user_id: event.user_id,
        done: true,
      });
      logger.info("CANDIDATE DONE EXAM");
    }
  });

  //******** TIME_OUT_SERVER EXAM ********/
  socket.on(Events.TIME_OUT_SERVER, (event) => {
    if (event.room_id) {
      socket.to(event.room_id).emit(Events.TIME_OUT_CLIENT, event);
      updateCandidateDetails(event.room_id, {
        user_id: event.user_id,
        stopped: true,
      });
      logger.info("CANDIDATE TIME_OUT EXAM");
    }
  });

  //******** ADD_TIME_TO_CANDIDATE_SERVER EXAM ********/
  socket.on(Events.ADD_TIME_TO_CANDIDATE_SERVER, (data_action, event) => {
    if (event.room_id) {
      const { minutes, duration, start_time } = data_action;

      updateCandidateDetails(event.room_id, {
        user_id: event.user_id,
        stopped: false,
        start_added_time: start_time,
        added_minutes: minutes,
        duration: duration,
      });

      socket
        .to(event.room_id)
        .emit(
          Events.ADD_TIME_TO_CANDIDATE_CLIENT,
          { minutes, duration, start_time },
          event
        );

      logger.info("ADD MINUTES TO CANDIDATE");
    }
  });
});

// function getSetData(key, cb) {
//   return new Promise((resolver, reject) => {
//     redisClient.get(key, (error, data) => {
//       if (error) return reject;
//     });
//   });
// }

server.listen(SERVER_PORT, () => {
  logger.info(`Socket Server is running on port ${SERVER_PORT}`);
});
// peerjs --port 3001
