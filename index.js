/* password code commented as-is (unchanged) */

// We enclose this in window.onload.
// So we don't have ridiculous errors.
window.onload = function() {

  // Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyCANqpfXb5WFINaKVL97q9HV5dVtpMfyRk",
    authDomain: "dlngrchat2.firebaseapp.com",
    projectId: "dlngrchat2",
    storageBucket: "dlngrchat2.firebasestorage.app",
    messagingSenderId: "963652739716",
    appId: "1:963652739716:web:bfbb26bc70d153b1ae58d1"
  };

  firebase.initializeApp(firebaseConfig);
  var db = firebase.database()

  class MEME_CHAT{

    home(){
      document.body.innerHTML = ''
      addBackgroundVideo()
      this.create_title()
      this.create_join_form()
    }

    chat(){
      addBackgroundVideo()
      this.create_title()
      this.create_chat()
    }

    create_title(){
      var title_container = document.createElement('div')
      title_container.setAttribute('id', 'title_container')

      var title_inner_container = document.createElement('div')
      title_inner_container.setAttribute('id', 'title_inner_container')

      var title = document.createElement('h1')
      title.setAttribute('id', 'title')
      title.textContent = 'DLNGR CHAT'

      title_inner_container.append(title)
      title_container.append(title_inner_container)
      document.body.append(title_container)
    }

    create_join_form(){
      var parent = this

      var join_container = document.createElement('div')
      join_container.setAttribute('id', 'join_container')

      var join_inner_container = document.createElement('div')
      join_inner_container.setAttribute('id', 'join_inner_container')

      var join_button_container = document.createElement('div')
      join_button_container.setAttribute('id', 'join_button_container')

      var join_button = document.createElement('button')
      join_button.setAttribute('id', 'join_button')
      join_button.innerHTML = 'Join The Chat <i class="fas fa-sign-in-alt"></i>'

      var join_input_container = document.createElement('div')
      join_input_container.setAttribute('id', 'join_input_container')

      var join_input = document.createElement('input')
      join_input.setAttribute('id', 'join_input')
      join_input.setAttribute('maxlength', 15)
      join_input.placeholder = 'Enter You Name'

      join_input.onkeyup = function(){
        if(join_input.value.length > 0){
          join_button.classList.add('enabled')
          join_button.onclick = function () {

            const name = join_input.value.trim()
            const lowerName = name.toLowerCase()

            for (let i = 0; i < PROTECTED_NAMES.length; i++) {
              const user = PROTECTED_NAMES[i]
              if (lowerName.includes(user.keyword)) {
                const enteredPassword = prompt(
                  `The name "${user.keyword}" is protected.\nEnter password to continue:`
                )
                if (enteredPassword !== user.password) {
                  alert("❌ Wrong password. Access denied.")
                  return
                }
                break
              }
            }

            parent.save_name(name)
            join_container.remove()
            parent.create_chat()
          }
        } else {
          join_button.classList.remove('enabled')
        }
      }

      join_button_container.append(join_button)
      join_input_container.append(join_input)
      join_inner_container.append(join_input_container, join_button_container)
      join_container.append(join_inner_container)
      document.body.append(join_container)
    }

    create_load(container_id){
      var container = document.getElementById(container_id)
      container.innerHTML = ''

      var loader_container = document.createElement('div')
      loader_container.setAttribute('class', 'loader_container')

      var loader = document.createElement('div')
      loader.setAttribute('class', 'loader')

      loader_container.append(loader)
      container.append(loader_container)
    }

    create_chat(){
      var parent = this

      var title_container = document.getElementById('title_container')
      var title = document.getElementById('title')
      title_container.classList.add('chat_title_container')
      title.classList.add('chat_title')

      var chat_container = document.createElement('div')
      chat_container.setAttribute('id', 'chat_container')

      var chat_inner_container = document.createElement('div')
      chat_inner_container.setAttribute('id', 'chat_inner_container')

      var chat_content_container = document.createElement('div')
      chat_content_container.setAttribute('id', 'chat_content_container')

      var chat_input_container = document.createElement('div')
      chat_input_container.setAttribute('id', 'chat_input_container')

      var chat_input_send = document.createElement('button')
      chat_input_send.setAttribute('id', 'chat_input_send')
      chat_input_send.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
fill="currentColor" viewBox="0 0 16 16">
  <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855l-.452.18a.5.5 0 0 0-.082.887l.41.26 4.995 3.178
  3.178 4.995.26.41a.5.5 0 0 0 .886-.083l6-15z"/>
</svg>
`

      chat_input_send.setAttribute('disabled', true)

      chat_input_send.style.display = "flex"
chat_input_send.style.opacity = "1"


      var chat_input = document.createElement('input')
      chat_input.setAttribute('id', 'chat_input')
      chat_input.setAttribute('maxlength', 1000)
      chat_input.placeholder = `${parent.get_name()}. Say something...`

      chat_input.onkeyup = function(event){
        if(chat_input.value.length > 0){
          chat_input_send.removeAttribute('disabled')
          chat_input_send.classList.add('enabled')

          if(event.key === 'Enter'){
            sendMessage()
          }
          chat_input_send.onclick = function(){
            sendMessage()
          }
        } else {
          chat_input_send.classList.remove('enabled')
          chat_input_send.setAttribute('disabled', true)
        }

        function sendMessage(){
          chat_input_send.setAttribute('disabled', true)
          chat_input_send.classList.remove('enabled')
          if(chat_input.value.length <= 0) return
          parent.create_load('chat_content_container')
          parent.send_message(chat_input.value)
          chat_input.value = ''
        }
      }

      chat_input_container.append(chat_input, chat_input_send)

      // LOGOUT BUTTON
var chat_logout_container = document.createElement('div')
chat_logout_container.setAttribute('id', 'chat_logout_container')

var chat_logout = document.createElement('button')
chat_logout.setAttribute('id', 'chat_logout')
chat_logout.textContent = `${parent.get_name()} • logout`

chat_logout.onclick = function(){
  localStorage.removeItem('name')
  location.reload()
}

chat_logout_container.append(chat_logout)

     chat_inner_container.append(
  chat_content_container,
  chat_input_container,
  chat_logout_container
)

      chat_container.append(chat_inner_container)
      document.body.append(chat_container)

      parent.create_load('chat_content_container')
      parent.refresh_chat()
    }

    save_name(name){
      localStorage.setItem('name', name)
    }

    send_message(message){
      var parent = this
      db.ref('chats/').once('value', function(message_object) {
        var index = parseFloat(message_object.numChildren()) + 1
        db.ref('chats/' + `message_${index}`).set({
          name: parent.get_name(),
          message: message,
          index: index
        }).then(function(){
          parent.refresh_chat()
        })
      })
    }

    get_name(){
      if(localStorage.getItem('name') != null){
        return localStorage.getItem('name')
      } else {
        this.home()
        return null
      }
    }

    refresh_chat(){
      var chat_content_container = document.getElementById('chat_content_container')

      db.ref('chats/').on('value', function(messages_object) {
        chat_content_container.innerHTML = ''
        if(messages_object.numChildren() == 0) return

        var messages = Object.values(messages_object.val())

        messages.forEach(function(data) {

          var name = data.name
          var message = data.message

          var message_container = document.createElement('div')
          message_container.setAttribute('class', 'message_container')
          
const role = USER_ROLES.find(r =>
  name.toLowerCase().includes(r.keyword)
)

if (role) {
  message_container.style.borderLeft = `5px solid ${role.color}`

  // PREMIUM LOOK ONLY FOR UDIT
  if (role.keyword === "udit") {
    message_container.classList.add("premium-user")
  }
}


          var message_inner_container = document.createElement('div')
          message_inner_container.setAttribute('class', 'message_inner_container')

          var message_user_container = document.createElement('div')
          message_user_container.setAttribute('class', 'message_user_container')

          var message_user = document.createElement('p')
          message_user.setAttribute('class', 'message_user')

          if (role) {
            message_user.innerHTML = `${name} <span class="badge" style="background:${role.color}">${role.tag}</span>`
          } else {
            message_user.textContent = name
          }

          var message_content_container = document.createElement('div')
          message_content_container.setAttribute('class', 'message_content_container')

          var message_content = document.createElement('p')
          message_content.setAttribute('class', 'message_content')
          message_content.textContent = message

          message_user_container.append(message_user)
          message_content_container.append(message_content)
          message_inner_container.append(message_user_container, message_content_container)
          message_container.append(message_inner_container)
          chat_content_container.append(message_container)
        })

        chat_content_container.scrollTop = chat_content_container.scrollHeight
      })
    }
  }

  var app = new MEME_CHAT()
  if(app.get_name() != null){
    app.chat()
  }
}

// Background video (unchanged)
function addBackgroundVideo() {
  if (document.querySelector('.video-bg')) return
  const videoBg = document.createElement('div')
  videoBg.className = 'video-bg'
  videoBg.innerHTML = `
    <video autoplay muted loop playsinline>
      <source src="pink-puff-clouds.1920x1080.mp4" type="video/mp4">
    </video>
  `
  document.body.appendChild(videoBg)
}

// Protected names (unchanged)
const PROTECTED_NAMES = [
  { keyword: "udit", password: "dlngrreturn" },
  { keyword: "dlngr", password: "dlngrreturn" },
  { keyword: "vaibhav", password: "super9415@" },
  { keyword: "supergaming", password: "super9415@" },
  { keyword: "admin", password: "admin999" }
]

// MULTI-USER TAGS (main change)
const USER_ROLES = [
  { keyword: "udit", tag: "CREATOR", color: "#ff4d4d" },
  { keyword: "supergaming", tag: "ADMIN", color: "#a855f7" },
  { keyword: "vaibhav", tag: "ADMIN", color: "#a855f7" },
  { keyword: "dlngr", tag: "VERIFIED", color: "#22c55e" },
  { keyword: "pranadh", tag: "VIP", color: "#2ce90fff" },
  { keyword: "harshit", tag: "MVP", color: "#e1ed0eff" }
]


