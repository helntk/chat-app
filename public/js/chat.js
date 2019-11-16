const socket = io()
const messages = document.querySelector("#messages")
// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const form = document.querySelector('#form')
form.addEventListener('submit',(e)=>{
  e.preventDefault();

  const button  = form.elements['button']
  const message = form.elements['message']

  button.setAttribute('disabled','disabled')
  socket.emit('sendMessage', message.value, (error)=>{
    button.removeAttribute('disabled')
    message.value = ''
    message.focus()
     if(error){
       return console.log(error)
     }
     console.log('message delivered')
  })
})

document.querySelector('#send-location').addEventListener('click',()=>{
  if(!navigator.geolocation){
    return alert('geolocation is not supported by your browser')
  }
  navigator.geolocation.getCurrentPosition((position)=>{
    socket.emit('sendLocation',{
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    },()=>{
       console.log('location shared')
    })


})

})
//options
const autoScroll = ()=>{
  //new message
  const newMessage = messages.lastElementChild

  //height of the new message
  const newMessageStyles = getComputedStyle(newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = newMessage.offsetHeight + newMessageStyles

  //visible height
  const visibleHeight = messages.offsetHeight

  //height of messages container
  const containerHeight = messages.scrollHeight

  // How far have i scrolled?
  const scrollOffset = messages.scrollTop + visibleHeight

  if(containerHeight - newMessageHeight <= scrollOffset ){
    messages.scrollTop = messages.scrollHeight

  }
}

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

socket.on('message',(message)=>{
    const html = Mustache.render(messageTemplate,{
      username: message.username,
      message: message.text,
      createdAt: moment(message.createdAt).format('h:mm a')

    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage',(username,url)=>{
       console.log(url)
       
       const html = Mustache.render(locationMessageTemplate, {
          url,
          username
       })

       messages.insertAdjacentHTML('beforeend',html)
       autoScroll()
})

socket.on('roomData',({room,users})=>{
   const html = Mustache.render(sidebarTemplate,{
     room,
     users
   }) 

   document.querySelector('#sidebar').innerHTML = html
})

socket.emit('join', {username, room},(error)=>{
     if(error){
       alert(error)
       location.href = '/'
     }
     
})