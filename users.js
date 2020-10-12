const users = [];

const addUser = (id, username, room) => {
	const existingUser = users.find(
		(user) => user.room == room && user.username == username
	);

	if (existingUser) {
		return { error: "Username is already taken" };
	}

	const user = { id, username, room };
	users.push(user);

	return user;
};

const getCurrentUser = (id) => {
	return users.find((user) => user.id == id);
};

const userLeave = (id) => {
	const index = users.findIndex((user) => user.id == id);

	if (index !== -1) {
		return users.splice(index, 1)[0];
	}
};

const getRoomUsers = (room) => {
	return users.filter((user) => user.room == room);
};

module.exports = {
	addUser,
	getCurrentUser,
	userLeave,
	getRoomUsers,
};
