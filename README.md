# 🎥 Video Updator Service

This Node.js application provides video upload, validation, trimming, merging, and streaming services. It's designed to handle shared video links, manage video files effectively, and ensure compliance with configurable size and duration limits.

---

## 📚 Table of Contents
- [🚀 Getting Started](#-getting-started)
- [⚙️ Project Structure](#-project-structure)
- [🧩 Modules](#-modules)

<hr />

## 🚀 Getting Started

### ✅ Prerequisites

Before you begin, ensure you have the following installed:

1. [Node.js and npm](https://nodejs.org/en/download/package-manager)
2. [FFmpeg](https://ffmpeg.org/download.html) - Configure the paths to `ffmpeg` and `ffprobe` binaries in your system.
3. Make sure PORT 3000 is open or you can configure it in .env file
4. Create a base_url variable in you postman in order to run the collection it should loop something like this `http://localhost:3001/api`
5. Add Authorization header in each of your request and you can create a random token for it by setting up in .env file something like: `TOKENS=jahkgvfkjav,jahfghjav`

### 💻 Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/tirthesh-bohra/video-updator.git
   cd video-updator
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

### 🤖 Running the Application

1. Start the server:
   ```sh
   npm start
   ```

2. Access the API at `http://localhost:3000` (or your configured port).


### 🛠 Running Tests

Run set of comprehensive e2e and unit tests to verify the functionality:
```sh
npm test
```

Run just the e2e tests to verify each routes' functionality:
```sh
npm run test:e2e
```

Run just the unit tests to verify the each components of core video service functionality:
```sh
npm run test:unit
```

---
## ⚙️ Project Structure

```
video-updator
├── README.md
├── src
│   ├── resolvers
│   │   ├── view-shared.js
│   │   ├── limits.js
│   │   ├── merge.js
│   │   ├── share.js
│   │   ├── trim.js
│   │   ├── upload.js
│   ├── services
│   │   ├── video.js
│   ├── config
│   │   ├── constants.js
│   │   ├── database.js
│   │   ├── manager.js
│   │   ├── schema.js
│   ├── express
│   │   ├── auth-wrapper.js
│   │   ├── error-handlers.js
│   │   ├── index.js
│   │   ├── last-resort-error-handler.js
│   │   ├── mount-middlewares.js
│   │   ├── mount-routes.js
│   │   ├── prime-request-context.js
│   ├── tests
│   │   ├── e2e-tests
│   │   │   ├── view-shared.test.js
│   │   │   ├── limits.test.js
│   │   │   ├── merge.test.js
│   │   │   ├── share.test.js
│   │   │   ├── trim.test.js
│   │   │   ├── upload.test.js
│   │   ├── unit-tests
│   │   │   ├── video-service.test.js
├── uploads
├── processed
├── temp
├── package.json
└── package-lock.json
└── database.sqlite
└── server.js
└── .env
```

---

## 💻 Modules

<details closed><summary>Resolvers</summary>

| File           | Summary                                                                                                                                             | Module                    |
|:---------------|:----------------------------------------------------------------------------------------------------------------------------------------------------|:--------------------------|
| view-shared.js | Handles shared video links, validates expiry, and streams video content.                                                                            | src/resolvers/view-shared.js |
| share.js | Handles creation of shared video link with expiry                                                                           | src/resolvers/share.js |
| limits.js | Updates limits to be set for video size, min duration and max duration                                                                           | src/resolvers/limits.js |
| merge.js | Processes the received videos ids and merges them together                                                                         | src/resolvers/merge.js |
| trim.js | Trims the given video id as per the start and end times                     | src/resolvers/trim.js |
| upload.js | Uploads the given video in our local directory                     | src/resolvers/upload.js |

</details>

<details closed><summary>Services</summary>

| File      | Summary                                                                                                                                           | Module              |
|:----------|:--------------------------------------------------------------------------------------------------------------------------------------------------|:--------------------|
| video.js  | Core video service that handles file operations, validation, video trimming, merging, cleanup, and streaming functionality.                       | src/services/video.js |

</details>

<details closed><summary>Application</summary>

| File      | Summary                                                                                                      | Module       |
|:----------|:-----------------------------------------------------------------------------------------------------------|:-------------|
| index.js    | Entry point for the server, initializing routes and middleware.                                             | src/express/index.js   |

</details>

<details closed><summary>Tests</summary>

| File                 | Summary                                                                                              | Module                 |
|:---------------------|:---------------------------------------------------------------------------------------------------|:-----------------------|
| view-shared.test.js | Contains comprehensive test cases for view-shared route. | src/tests/e2e-tests/view-shared.test.js |
| limits.test.js | Contains comprehensive test cases for limits route. |  src/tests/e2e-tests/limits.test.js |
| merge.test.js | Contains comprehensive test cases for merge route. |  src/tests/e2e-tests/merge.test.js |
| share.test.js | Contains comprehensive test cases for share route. |  src/tests/e2e-tests/share.test.js |
| trim.test.js | Contains comprehensive test cases for trim route. |  src/tests/e2e-tests/trim.test.js |
| upload.test.js | Contains comprehensive test cases for upload route. |  src/tests/e2e-tests/upload.test.js |
| video-service.test.js | Contains comprehensive units tests for each components of video service. |  src/tests/unit-tests/upload.test.js |

</details>