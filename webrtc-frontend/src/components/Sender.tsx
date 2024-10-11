import { useEffect, useState } from "react"

export const Sender = () =>{
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'sender'
            }));
        }
        setSocket(socket);
    }, []);

    const initiateConn = async () =>{
        if(!socket) return;

        const pc = new RTCPeerConnection();

        pc.onnegotiationneeded = async () =>{
            console.log("onnegotiationneeded");
            const offer = await pc.createOffer(); //sdp
            await pc.setLocalDescription(offer);
            socket?.send(JSON.stringify({
                type: 'createOffer',
                sdp: pc.localDescription
            }));
        }

        pc.onicecandidate = (event) =>{
            console.log("ice", event);
            if(event.candidate) {
                socket?.send(JSON.stringify({ type: 'iceCandidate', candidate: event.candidate }));
            }
        }

        socket.onmessage = (event) =>{
            const data = JSON.parse(event.data);
            if(data.type == "createAnswer"){
                pc.setRemoteDescription(data.sdp);
            } else if(data.type === "iceCandidate"){
                pc.addIceCandidate(data.candidate);
            }
        }

        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
        pc.addTrack(stream.getVideoTracks()[0]);
    }
    return (
        <div>
            Sender
            <button onClick={initiateConn}> Send data </button>
        </div>
    )
}