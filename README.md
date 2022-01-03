# vlc-bgm
Web interface for controlling VLC remotely to use as a background music (BGM) player

## About
This is designed to be used when VLC is running on a separate device that isn't always easily accessible, such as 
a laptop behind the scenes in an event. The web interface allows you to control the interval music from your phone or a computer. The advantages of this project over the built-in interface are that it comes with shortcuts to automate tasks such as gradually increasing volume and fade-in/fade-out. In the future, I will add some of the features that are in the built-in interface such as manually being able to set the volume.

## Installation
### Requirements
* [VLC](https://www.videolan.org/vlc/)
* [Node.js](https://nodejs.org/en/)
* [Git (optional)](https://git-scm.com/)
### Setting up
1. Enable HTTP interface in VLC (see [image](https://cdn.discordapp.com/attachments/701854785946517558/927565561515347988/unknown.png))
2. Set password for HTTP interface (see [image](https://cdn.discordapp.com/attachments/701854785946517558/927565726674468884/unknown.png))
3. Clone the repository via Git (``git clone https://github.com/davidcralph/vlc-bgm``) or download it via "Code" -> "Download ZIP" on the GitHub UI
4. ``cd`` into the directory in a terminal and run ``npm i`` (or ``yarn``) to install dependencies
5. Copy ``config.example.ini`` to ``config.ini`` and fill it out
6. Make sure VLC is running and run ``npm start`` to start the interface

## License
[MIT](LICENSE)
