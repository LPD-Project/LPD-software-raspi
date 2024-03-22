


document.addEventListener('DOMContentLoaded', function () {
    const device_serial_code = "qwerasdfzxcv"
    // Get a reference to the HTML video element where we will display the stream
    const videoElement = document.getElementById('videoElement');

    // Constraints to access the camera and microphone
    const constraints = {
      audio: false,
      video: true
    };

    var localStream
    var sender
    var peerConnection
    // Get the user media (camera and microphone) using getUserMedia
    navigator.mediaDevices.getUserMedia(constraints)
      .then(mediaStream => {
      	localStream = mediaStream
        // Display the media stream in the video element
        videoElement.srcObject = localStream;

        // Create a RTCPeerConnection
        peerConnection = new RTCPeerConnection({
          iceServers: [
              { urls: 'stun:stun1.l.google.com:19302' },
             
	      { urls : 'turn:146.190.100.131:4443?transport=tcp' , username: 'lpdTurnServerDevice' , credential: 'alaI98sadjSJM37SANOkj7dmu8aSDZXkjgmi39a'},
	    ]
        });

        // Add the media stream as a track to the peer connection
        localStream.getTracks().forEach(track => {
          sender = peerConnection.addTrack(track, localStream);
        });
	peerConnection.onconnectionstatechange = (ev) =>  {
		console.log("hello state change")
		console.log('onconnectionstatechange', ev)
	}

        peerConnection.onicecandidateerror = e => {
            console.log('ICE Candidate Error', e)
          };

        // Log the peer connection's state changes
        peerConnection.oniceconnectionstatechange = function(event) {
          console.log('oniceconnectionstatechange state changed:', peerConnection.iceConnectionState);
          if( peerConnection.iceConnectionState == "failed" || peerConnection.iceConnectionState == "disconnected" || peerConnection.iceConnectionState =="closed") {
          	socket.emit('DeviceDisconnection', { "device_serial_code": device_serial_code });

          	location.reload()
          }
        };

        // Log the gathered ICE candidates
        peerConnection.onicecandidate = function(event) {
          if (event.candidate) {
            const candidate = event.candidate

            const iceCandidateMap = {
                'candidate': candidate.candidate,
                'sdpMid': candidate.sdpMid,
                'sdpMLineIndex': candidate.sdpMLineIndex,
              };
              socket.emit('IceCandidateMessage', {
                'message': iceCandidateMap,
              });

            console.log('New ICE candidate:', event.candidate);
          } else {
          console.log("onice",event);
            console.log('All ICE candidates have been gathered.');
            socket.emit('deviceReadyState', { 'device_serial_code' : device_serial_code });
          }
        };

        //const socket = io('https://lpd-backend.adaptable.app/');
        //const socket = io('https://plankton-app-xmeox.ondigitalocean.app'); 
	const socket = io('http://192.168.1.44:3000')



        socket.on('onIceCandidateMessage', async (message) => {

            const IceMap = message.message

            const rtcIceCandidate = new RTCIceCandidate({
              candidate: IceMap.candidate,
              sdpMid: IceMap.sdpMid,
              sdpMLineIndex: IceMap.sdpMLineIndex
            });

            // Add the RTCIceCandidate to the peerConnection
            peerConnection.addIceCandidate(rtcIceCandidate);

            console.log('onIceCandidateMessage', message);
        });

        // Handle incoming answer from the other peer
        socket.on('onSdpAnswerMessage', async (answer) => {
            const description = new RTCSessionDescription(answer.sdp, 'offer');

            peerConnection.setRemoteDescription(description)
            console.log('Received answer:', answer);


        });

        socket.on('killDevice' , async (message) => {
        	console.log( "i got kill command" ) ; 
        	location.reload()
        }) ;

        socket.on('checkAlive', async (message) => {
            socket.emit('DeviceHeartbeat',{'device_serial_code' : device_serial_code})
            console.log("DeviceHeartbeat")
        });


        socket.on('onCameraControl', async (message) => {
            console.log("onCameraControl",message)
        });
	socket.emit('DeviceConnection', { "device_serial_code": device_serial_code });
        // Create an offer
        peerConnection.createOffer()
          .then(offer => {
            peerConnection.setLocalDescription(offer)    
            const sdpData = {
                'sdp': offer.sdp.toString(),
                'type': offer.type.toString()
              };

            socket.emit('OfferSdpMessage', {
                'sdp': sdpData,
                'type': "offer",
                'device_serial_code': device_serial_code ,
            });

          })
          .catch(error => {
            console.error('Error creating offer:', error);
          });

	peerConnection.onicecandidateerror = e => {
	console.log('ice error ' , e)
	}


      })
      .catch(error => {
        console.error('Error accessing user media:', error);
      });


  });


