const express = require('express');
const http = require('http')
const path = require('path')
const app = express()
const socketio = require('socket.io')
const Filter = require('bad-words')
const server = http.createServer(app);
const generateMessage =require('./utils/messages') 
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/user')
const io = socketio(server);
io.on('connection',(socket)=>{

    // let count = 0
    /* socket.emit('countUpdated', count)

    socket.on('increment',()=>{
        count++
        // socket.emit('countUpdated', count)
        io.emit('countUpdated', count)

    }) */
    socket.on('sendMessage',(message, cb)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return cb('profanity is not allowed')
        }

        io.to(user.room).emit('message',generateMessage(user.username,message))
        cb()
    })
    socket.on('disconnect',()=>{
       const user = removeUser(socket.id)

       if(user){
          io.to(user.room).emit('message',generateMessage('admin',`${user.username} has left`))
          io.emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        }
    })

    socket.on('sendLocation',(coords, cb)=>{
      const user = getUser(socket.id)

      io.to(user.room).emit('locationMessage',`https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
      cb()
    })

    socket.on('join',({username, room}, callback) =>{
       const {error, user} = addUser({id: socket.id, username, room})
       if(error){
        return callback(error)
       }
       socket.join(user.room)
       socket.emit('message',generateMessage('admin','Welcome'))
       socket.broadcast.to(user.room).emit('message', generateMessage('admin',`${user.username} has joined the room`))
       io.emit('roomData',{
           room: user.room,
           users: getUsersInRoom(user.room)
       })
       callback()
    })
})
const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))
server.listen(port,()=>{
    console.log(`the server is up on ${port}`)
})
