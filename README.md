# Ethos Web BIP39 Tool

The purpose of this tool is to allow users to get additional data/insights about their addresses through an easy-to-use web interface. 

Install all the dependencies by running `npm install`

# npm scripts

`npm run start` starts a server that serves up the page at localhost:8080

`npm run convert` converts the node file **prebundle.js** in `static/js/` and converts it to **bundle.js** that can be embedded in a browser

# Structure of the code

##### Server code
All server code is held in `server/`

##### Static folder
Everything that is served up from a static express path is in the static folder. That includes the css and the javascript

##### index.html
This is the main page that gets served up by the server