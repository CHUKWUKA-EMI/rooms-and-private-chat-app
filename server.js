const express = require("express");
const cors = require("cors");
const http = require("http");
const { addUser, getCurrentUser, userLeave, getRoomUsers } = require("./users");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const server = http.createServer(app);

const io = require("socket.io")(server, {
	pingTimeout: 120000,
});

const privateChat = io.of("/friend");

privateChat.use((socket, next) => {
	const friends = ["Chukwuka", "Justice"];
	const user = socket.handshake.query.name;
	const isValid = friends.includes(user);
	if (!isValid) {
		next(
			new Error(
				"You are not friends with this user. So you can't chat with him/her"
			)
		);
	} else {
		socket.user = user;
		next();
	}
});

privateChat.on("connection", (socket) => {
	console.log(`< ${socket.user} connected`);
	socket.on("chat", ({ chat }) => {
		console.log("chat", chat);
		privateChat.emit("message", { user: socket.user, text: chat });
	});
});

io.on("connection", (socket) => {
	io.use((socket, next) => {
		if (socket.id) return next();
		next(new Error("Socket ID not found"));
	});

	console.log(">user connected");
	socket.on("joinRoom", ({ username, room }) => {
		const user = addUser(socket.id, username, room);

		socket.emit("message", {
			user: "admin",
			text: `Welcome to ${user.room} chat Room`,
		});
		socket.broadcast.to(user.room).emit("message", {
			user: "admin",
			text: `${user.username} has joined`,
		});
		socket.join(user.room);
		io.to(user.room).emit("roomData", {
			room: user.room,
			users: getRoomUsers(user.room),
		});
	});

	socket.on("chatMessage", (message) => {
		console.log("data", message);
		const user = getCurrentUser(socket.id);
		if (user) {
			io.to(user.room).emit("message", { user: user.username, text: message });
		}
	});

	socket.on("disconnect", () => {
		console.log("user has left");
		const user = userLeave(socket.id);
		if (user) {
			io.to(user.room).emit("message", {
				user: "admin",
				text: `${user.username} has left`,
			});
			socket.leave(user.room);
		}
	});

	socket.on("joinFriend", ({ friendId, sender }) => {
		const user = getCurrentUser(socket.id);
		const userRoom = getRoomUsers(user.room);
		const friend = userRoom.filter((user) => user.id == friendId);
		if (user.username == sender) {
			console.log(sender, friend[0].id);
			socket.join(friend[0].id);

			socket.on("privateMessage", (message) => {
				console.log("privateChat", message);
				io.to(friend[0].id).emit("message", {
					user: user.username,
					text: message,
				});
			});
		}
	});
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
	console.log(`Server listening on Port ${PORT}`);
});
