# e l e c t r o n

This is a browser-based waveform generator application that allows one person to control the generated waveforms while an arbitrary number of listeners can access the waveforms in real-time. The application also supports a "solo" mode for individual use.

Please note that this application was built many years ago and its coding practices are severely outdated.

This repository contains both the server (Node.js) and the client (HTML + JS). It makes use of the brilliant p5.js library for audio and visuals generation.

## Technical details

The application is built using Node.js, Express, and Socket.IO. It provides real-time communication between the driver and listeners through WebSockets. When a driver selects parameters for waveform generation, they are transmitted to all connected listeners via socket events. The server stores session information, authentication tokens for drivers, and the last waveform state in memory to keep everyone synchronized. This ensures that new listeners can join an ongoing session and receive the current waveform data immediately upon connection.

## Installation

To install and run the application, simply follow these steps:

1. Clone the repository
2. Run npm install to install the necessary dependencies
3. Start the server with `node index.js`

## Usage

Once the server is running, navigate to the application URL (e.g., http://localhost:5000) in your browser. You will be presented with options to create a session as a driver or join an existing session as a listener.

If you choose to create a session, you will be given a unique session ID that you can share with others who want to listen to the generated waveforms. Listeners can join a session by entering the provided session ID on electron's homepage.

In "solo" mode, users can experiment with waveform generation without sharing it with others. Simply select "play solo" from the homepage to begin.

## Contributing

If you have any suggestions or improvements, feel free to open an issue or submit a pull request. However, note that I currently have limited time to dedicate to this project, so things will move very slowly.

At the moment, the best way in which you can contribute is by creating a responsive and usable mobile UI, as the current one is starting to show its age, and doesn't work great on mobile devices.

## License

This project is licensed under the MIT License. See the LICENSE file for details.