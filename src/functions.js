// Data structure
let data_structure = {
  room_id: {
    room_id: "",
    start_exam: false,
    start_time: "",
    group_id: "",
    center_id: "",
    district_id: "",
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
        seat_number: 0,
        duration: 0,
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
  active = false,
  seat_number = 0
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
  seat_number: seat_number,
  added_minutes: 0,
  start_added_time: "",
  duration: 0,
});

/**
 * Create a room object
 * @param {*} room_id
 * @param {*} group_id
 * @param {*} candidates
 * @returns Object
 */
const createNewRoom = (
  room_id,
  group_id,
  candidates = [],
  rule = false,
  exam_id,
  center_id,
  district_id,
  duration = 0
) => ({
  room_id: room_id,
  start_exam: false,
  start_time: null,
  group_id: group_id,
  candidates: candidates,
  exam_done: false,
  duration: duration,
  rule: rule, // stop_candidate_when_comeback
  exam_id: exam_id,
  center_id: center_id,
  district_id: district_id,
});

// const Rules = {
//   right_click_enabled: true,
//   copy_enabled: true,
//   paste_enabled: true,
//   stop_candidate_when_comeback: true,
//   allow_to_leave_browser: true,
// };

module.exports = {
  createCandidate,
  createNewRoom,
};
