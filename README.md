# Ethos Web BIP39 Tool

The purpose of this tool is to allow users to get additional data/insights about their addresses through an easy-to-use web interface. 

# How to Use

Open up index.html and enter in the required information to generate what you need

You can also visit https://ethos-source.github.io/bip39-web-tool/ which is hosted on Github pages.

# IMPORTANT!!!!

ETHOS DOES NOT HOST A COPY OF THIS AND DOES NOT HAVE ANY PLANS TO. THIS IS AN OPEN SOURCE TOOL THAT ETHOS HAS PROVIDED TO HELP YOU ACCESS YOUR PRIVATE KEYS. DO NOT USE ANY UNTRUSTED VERSIONS OF THIS APPLICATION.

# For Developers

Install all the dependencies by running `npm install`

If you make any changes to **prebundle.js** then be sure to run `npm run convert` to bundle those changes

# npm scripts

`npm run convert` converts the node file **prebundle.js** in `static/js/` and converts it to **bundle.js** that can be embedded in a browser

# Structure of the code

##### Static folder
Everything that is served up from a static express path is in the static folder. That includes the css and the javascript and images

##### index.html
This is the main page