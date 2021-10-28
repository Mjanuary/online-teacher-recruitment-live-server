// Data structure
let data_structure = {
  room_id: {
    room_id: "",
    start_exam: false,
    start_time: "",
    room_id: "",
    group_id: "",
    candidates: [
      {
        user_id: "",
        peer_id: "",
        blocked: false,
        active: false,
        joined: false,
        done: false,
        super: false,
        removed: false,
      },
    ],
  },
};

/**
 * Create a candidate object
 * @param {*} room_id
 * @param {*} user_id
 * @param {*} supervisor
 * @param {*} peer_id
 * @param {*} active
 * @returns Object
 */
const createCandidate = (
  room_id,
  user_id,
  supervisor = false,
  peer_id = "",
  active = false
) => ({
  user_id: user_id,
  peer_id: peer_id,
  supervisor: supervisor,
  room_id: room_id,
  active: active,
  joined: false,
  done: false,
  removed: false,
  stopped: false,
});

/**
 * Create a room object
 * @param {*} room_id
 * @param {*} group_id
 * @param {*} candidates
 * @returns Object
 */
const createNewRoom = (room_id, group_id, candidates = []) => ({
  room_id: room_id,
  start_exam: false,
  start_time: null,
  group_id: group_id,
  candidates: candidates,
  exam_done: false,
});

module.exports = {
  createCandidate,
  createNewRoom,
};
