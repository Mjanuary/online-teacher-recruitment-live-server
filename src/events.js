const Events = {
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

  CAND_DONE_EXAM_CLIENT: "CAND_DONE_EXAM_CLIENT",
  CAND_DONE_EXAM_SERVER: "CAND_DONE_EXAM_SERVER",

  JOIN_ROOM_CANDIDATE_SERVER: "JOIN_ROOM_CANDIDATE_SERVER",
  JOIN_ROOM_SUPERVISOR_SERVER: "JOIN_ROOM_SUPERVISOR_SERVER",

  CREATE_ROOM_SERVER: "CREATE_ROOM_SERVER",
  NEW_USER_JOINED_CLIENT: "NEW_USER_JOINED_CLIENT",

  SETUP_ROOM_SERVER: "SETUP_ROOM_SERVER",
  GET_ROOM_INFO_SERVER: "GET_ROOM_INFO_SERVER",
  DELETE_ROOM_SERVER: "DELETE_ROOM_SERVER",

  EXAM_DONE_SERVER: "EXAM_DONE_SERVER",
  EXAM_DONE_CLIENT: "EXAM_DONE_CLIENT",

  TIME_OUT_CLIENT: "TIME_OUT_CLIENT",
  TIME_OUT_SERVER: "TIME_OUT_SERVER",

  ADD_TIME_TO_CANDIDATE_CLIENT: "ADD_TIME_TO_CANDIDATE_CLIENT",
  ADD_TIME_TO_CANDIDATE_SERVER: "ADD_TIME_TO_CANDIDATE_SERVER",

  USER_DISCONNECTED_ONLINE_SERVER: "USER_DISCONNECTED_ONLINE_SERVER",
  USER_DISCONNECTED_ONLINE_CLIENT: "USER_DISCONNECTED_ONLINE_CLIENT",

  DOCUMENT_VALIDATION_SERVER: "DOCUMENT_VALIDATION_SERVER",
  DOCUMENT_VALIDATION_CLIENT: "DOCUMENT_VALIDATION_CLIENT",

  CLAIMING_CHANGE_SERVER: "CLAIMING_CHANGE_SERVER",
  CLAIMING_CHANGE_CLIENT: "CLAIMING_CHANGE_CLIENT",

  REQUEST_EXAM_SERVER: "REQUEST_EXAM_SERVER",
};

module.exports = Events;
