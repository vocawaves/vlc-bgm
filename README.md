# vlc-bgm
Web interface for controlling VLC remotely to use as a background music (BGM) player

## About
This is designed to be used when VLC is running on a separate device that isn't always easily accessible, such as 
a laptop behind the scenes in an event. The web interface allows you to control the interval music from your phone or a computer. The advantages of this project over the built-in interface are that it comes with shortcuts to automate tasks such as gradually increasing volume and fade-in/fade-out.

## Installation
### Quick start
Download a release from [here](https://github.com/davidcralph/vlc-bgm/releases), extract the folder, modify the config then run the binary.
### Requirements
* [VLC](https://www.videolan.org/vlc/)
* [Node.js](https://nodejs.org/en/)
* [Git (optional)](https://git-scm.com/)
### Setting up
1. Enable HTTP interface in VLC (see [image](https://cdn.discordapp.com/attachments/701854785946517558/927565561515347988/unknown.png))
2. Set password for HTTP interface (see [image](https://cdn.discordapp.com/attachments/701854785946517558/927565726674468884/unknown.png))
3. Clone the repository via Git (``git clone https://github.com/davidcralph/vlc-bgm``) or download it via "Code" -> "Download ZIP" on the GitHub UI
4. ``cd`` into the directory in a terminal and run ``npm i`` (or ``yarn``) to install dependencies
5. Copy ``src/config.example.ini`` to ``src/config.ini`` and fill it out
6. Make sure VLC is running and run ``npm start`` to start the interface
### Building
Binaries can be created with ``npm run build-<os>``, etc ``npm run build-win`` or ``npm run build-linux``. These will appear in a ``dist`` directory. You can also run ``npm run build`` to build for all operating systems.

## License
[MIT](LICENSE)
