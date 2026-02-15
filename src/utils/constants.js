// the word 'Enum' is also seen in roblox studio!
// im guessing Enum is just referring to a constant?

export const UserRolesEnum = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
}; // here we are sending the ENTIRE object

export const AvailableUserRole = Object.values(UserRolesEnum); // we are only sending the array aka the values of the object ONLY, so ["admin", "project_admin", "member"]
// what's the point of this though?

export const TaskStatusEnum = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

export const AvailableTaskStatuses = Object.values(TaskStatusEnum);
