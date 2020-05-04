# Dyad Finder 

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/codders/dyad-finder)

Match people in pairs

Dyad Finder helps you find matched pairs of people from a larger group, by inviting group members to share their partner preferences and calculating the best possible matches using the [Stable roomates](https://en.wikipedia.org/wiki/Stable_roommates_problem) algorithm.

## Install

The user interface for this project is writen in HTML5, CSS and Javascript (jQuery) - it requires no installation and can be run directly by visiting the [index.html](public/index.html) file in a web-browser.

It connects to a back-end server, which is an [express](https://expressjs.com/) app deployed to [Firebase](https://firebase.google.com/).

```sh
$ npm install firebase-tools
$ npx firebase login
$ npx firebase init
```

## Test

The test scripts can be run by executing

```
$ npm run test
```

from the [functions](functions) folder.

## Deploy

With firebsae configured, deploy the application with

```sh
$ npx firebase deploy
```

## API

There is an API!

## Contributing

Feel free to dive in! [Open an issue](https://github.com/codders/dyad-finder/issues/new) or submit PRs.

Dyad Finder follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) Code of Conduct.

## License

[AGL-3.0-or-later](LICENSE) © Arthur Taylor 
