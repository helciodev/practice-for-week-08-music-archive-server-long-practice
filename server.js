const http = require("http");
const fs = require("fs");

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync("./seeds/artists.json"));
let albums = JSON.parse(fs.readFileSync("./seeds/albums.json"));
let songs = JSON.parse(fs.readFileSync("./seeds/songs.json"));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => {
    // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers["content-type"]) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    //1 Get all the artists
    if (req.method === "GET" && req.url === "/artists") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.write(JSON.stringify(artists));
      return res.end();
    }
    //2 Get a specific artist's details based on artistId
    if (req.method === "GET" && req.url.startsWith("/artists")) {
      const urlSplit = req.url.split("/");
      const artistId = urlSplit[2];
      if (urlSplit.length === 3) {
        const artist = artists.find((el) => el.artistId === Number(artistId));

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(artist));
        return res.end();
      }
    }
    //3 Add an artist
    if (req.method === "POST" && req.url === "/artists") {
      const { name } = req.body;
      const newArtist = { artistId: getNewArtistId(), name };
      artists.push(newArtist);

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.write(JSON.stringify(newArtist));
      return res.end();
    }
    //4 Edit a specified artist by artistId
    if (
      req.method === "PATCH" ||
      (req.method === "PUT" && req.url.startsWith("/artists"))
    ) {
      const urlSplit = req.url.split("/");
      const artistId = urlSplit[2];
      if (urlSplit.length === 3) {
        const { name } = req.body;

        const artist = artists.find((el) => el.artistId === Number(artistId));

        artist.name = name;
        artist.updatedAt = new Date();

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(artist));
        return res.end();
      }
    }
    //5 Delete a specified artist by artistId

    if (req.method === "DELETE" && req.url.startsWith("/artists")) {
      const urlSplit = req.url.split("/");
      if (urlSplit.length === 3) {
        const artistId = urlSplit[2];
        const artistIndex = artists.indexOf(
          (el) => el.artistId === Number(artistId)
        );
        artists.splice(artistIndex, 0);
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        const message = { message: "Deleted Successfully" };
        res.write(JSON.stringify(message));
        return res.end();
      }
    }

    //6 Get all albums of a specific artist based on artistId
    if (req.method === "GET" && req.url.startsWith("/artists")) {
      const urlSplit = req.url.split("/");
      const lastSplitted = urlSplit[3];
      if (urlSplit.length === 4 && lastSplitted === "albums") {
        const artistId = urlSplit[2];
        const artistAlbums = albums.filter(
          (el) => el.artistId === Number(artistId)
        );

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.write(JSON.stringify(artistAlbums));
        return res.end();
      }
    }

    // 7 Get a specific album's details based on albumId
    if (req.method === "GET" && req.url.startsWith("/albums")) {
      const urlSplit = req.url.split("/");
      if (urlSplit.length === 3) {
        const albumId = urlSplit[2];
        const albumSongs = songs.filter((s) => s.albumId === Number(albumId));
        const album = albums.find((el) => el.albumId === Number(albumId));
        album.songs = albumSongs;
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.write(JSON.stringify(album));
        return res.end();
      }
    }

    //8 Add an album to a specific artist based on artistId
    if (req.method === "POST" && req.url.startsWith("/artists")) {
      const urlSplit = req.url.split("/");
      const lastSplitted = urlSplit[3];
      if (urlSplit.length === 4 && lastSplitted === "albums") {
        const artistId = urlSplit[2];
        const { name } = req.body;
        const newAlbum = {
          artistId: Number(artistId),
          albumId: getNewAlbumId(),
          name,
        };
        albums.push(newAlbum);

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 201;
        res.write(JSON.stringify(newAlbum));
        return res.end();
      }
    }

    //9 Edit a specified album by albumId
    if (
      req.method === "PATCH" ||
      (req.method === "PUT" && req.url.startsWith("/albums"))
    ) {
      const urlSplit = req.url.split("/");
      if (urlSplit.length === 3) {
        const albumId = urlSplit[2];
        const album = albums.find((el) => el.albumId === Number(albumId));
        const { name } = req.body;
        album.name = name;
        album.updatedAt = new Date();

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.write(JSON.stringify(album));
        return res.end();
      }
    }

    // Delete a specified album by albumId
    if (req.method === "DELETE" && req.url.startsWith("/albums")) {
      const urlSplit = req.url.split("/");
      if (urlSplit.length === 3) {
        const albumId = urlSplit[2];
        const albumIndex = albums.indexOf(
          (el) => el.albumId === Number(albumId)
        );
        albums.splice(albumIndex, 1);
        const message = { message: "Deleted successfully" };

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.write(JSON.stringify(message));
        return res.end();
      }
    }

    // 11 Get all songs of a specific artist based on artistId

    if (req.method === "GET" && req.url.startsWith("/artists")) {
      const urlSplit = req.url.split("/");
      const lastSplitted = urlSplit[3];
      if (urlSplit.length === 4 && lastSplitted === "songs") {
        const artistId = urlSplit[2];
        const artistAlbumsIds = albums.map((el) =>
          el.artistId === Number(artistId) ? el.albumId : ""
        );
        const artistsSongs = [];
        songs.forEach((song) => {
          if (artistAlbumsIds.includes(song.albumId)) {
            artistsSongs.push(song);
          }
        });

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.write(JSON.stringify(artistsSongs));
        return res.end();
      }
    }
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log("Server is listening on port", port));
