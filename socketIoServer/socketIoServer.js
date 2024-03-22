const socketio = require('socket.io');
//const { Signaling } = require('../webRTC/signalling');
const socketioclient = require('socket.io-client');


let io ;
let client ;

module.exports = {

    attach: (httpServer) => {

      io = socketio(httpServer);
      // connect to backend server
      let laserState
      let cameraState

      //client = socketioclient("https://plankton-app-xmeox.ondigitalocean.app")
      client = socketioclient("http://192.168.1.44:3000")

      client.emit('RaspiConnection',{device_serial_code:'qwerasdfzxcv'})

      client.on ('onCameraControl', (message) => {
        console.log(message )
        console.log(message['camera'] )
        cameraState = message['camera']

        io.emit('jetsonCameraCommand', {camera : message['camera'] })
      } )

      client.on ('onLaserControl' , (message) => {
        console.log(message )
        console.log(message['laser'] )

        laserState = message['laser']

        io.emit('jetsonLaserCommand' , {laser : message['laser']})
      })


      io.on('connection', (socket) => {
        console.log('a user connected');
        // Handle 'disconnect' events
        socket.on('disconnect', () => {
          console.log('user disconnected');
        });
      });

      setInterval(async () => {
        console.log("boardcast out ,"+ cameraState + laserState)
        io.emit('jetsonCameraCommand', {camera : cameraState })
        io.emit('jetsonLaserCommand' , {laser : laserState})
    }, 5 * 1000);

    }

}
