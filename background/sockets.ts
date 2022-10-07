// import { WebSocketServer } from 'ws';

// const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;

// const wss = new WebSocketServer({ port });

// wss.on('connection', (ws) => {

//   ws.id = Math.random().toString(36).substr(2, 5);

//   ws.on('message', function onMessage (data) {
//     console.log('Received from the frontend: %s', data, this.id);
//   });

//   ws.send('Hi from the backend!');
// });
