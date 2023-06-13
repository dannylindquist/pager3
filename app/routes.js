import polka from "polka";
import { parse as parseCookie } from "cookie-es";
import { createHash } from "node:crypto";
import { ValueStore } from "./valueStore.js";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import bodyParser from "body-parser";

const app = polka({
  onError: (err, req, res) => {
    console.error(err);
    res.writeHead(500).end("uh oh");
  },
});

const values = new ValueStore();

const locations = ["bothell", "woodinville"];
const BOTHELL_HASH = hashString(`bothell${process.env.BOTHELL_PASSWORD}`);
const WOODINVILLE_HASH = hashString(
  `woodinville${process.env.WOODINVILLE_PASSWORD}`
);

/**
 *
 * @param {string} str
 * @returns string
 */
function hashString(str) {
  return createHash("md5").update(str).digest("hex");
}

/**
 *
 * @param {string} location
 * @returns
 */
function getLocationHash(location) {
  if (location === "bothell") {
    return BOTHELL_HASH;
  }
  if (location === "woodinville") {
    return WOODINVILLE_HASH;
  }
}

app.use(bodyParser.json());

app.use((req, res, next) => {
  if (!req.headers.cookie) {
    next();
    return;
  }
  const cookies = parseCookie(req.headers.cookie ?? "");
  const token = cookies.token;
  if (token) {
    const [location, hash] = token.split("-");
    const expectedHash = getLocationHash(location);
    if (expectedHash?.toString() === hash) {
      req.token = location;
    }
  }
  next();
});

app.get("/", async (req, res) => {
  if (!req.token) {
    res
      .writeHead(302, {
        Location: "/login",
      })
      .end();
    return;
  }

  const indexFile = await readFile("./public/index.html", "utf-8");
  const [first, ...rest] = req.token;
  const location = first.toUpperCase() + rest.join("");
  res
    .writeHead(200, {
      "content-type": "text/html",
    })
    .end(indexFile.replace(/\{\{location\}\}/g, location));
});

app.get("/display/:location?", async (req, res) => {
  const hasLocation =
    req.token || locations.includes(req.params.location?.toLowerCase());
  if (!hasLocation) {
    res
      .writeHead(302, {
        Location: "/login",
      })
      .end();
    return;
  }

  const token = req.token || req.params.location;
  const indexFile = await readFile("./public/display.html", "utf-8");
  const [first, ...rest] = token;
  const location = first.toUpperCase() + rest.join("").toLowerCase();
  res
    .writeHead(200, {
      "content-type": "text/html",
    })
    .end(indexFile.replace(/\{\{location\}\}/g, location));
});

app.get("/login", (req, res) => {
  if (req.token) {
    res.writeHead(302, {
      location: "/",
    });
    return;
  }
  const loginPage = createReadStream("./public/login.html");
  res.writeHead(200, {
    "content-type": "text/html",
  });
  loginPage.pipe(res);
});

app.post("/login", (req, res) => {
  const location = req.body.location.toLowerCase();
  const password = req.body.password;

  if (!locations.includes(location)) {
    res
      .writeHead(403, {
        "content-type": "application/json",
      })
      .end(JSON.stringify({ message: "Invalid credentials" }));
    return;
  }

  if (location === "woodinville") {
    if (password !== process.env.WOODINVILLE_PASSWORD) {
      res
        .writeHead(403, {
          "content-type": "application/json",
        })
        .end(JSON.stringify({ message: "Invalid credentials" }));
      return;
    }
  } else if (location === "bothell") {
    if (password !== process.env.BOTHELL_PASSWORD) {
      res
        .writeHead(403, {
          "content-type": "application/json",
        })
        .end(JSON.stringify({ message: "Invalid credentials" }));
      return;
    }
  }
  const token = `${location}${password}`;
  const hash = hashString(token);
  res
    .writeHead(200, {
      "content-type": "application/json",
      "set-cookie": `token=${location}-${hash};Max-Age=31536000;HttpOnly;Same-Site=Lax;`,
    })
    .end(
      JSON.stringify({
        message: "success",
      })
    );
});

app.post("/logout", (req, res) => {
  res
    .writeHead(302, {
      location: "/login",
      "set-cookie": "token=;Max-Age=0;HttpOnly;",
    })
    .end();
});

app.get("/stream/:location", (req, res) => {
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
  });
  const location = req.params.location.toLowerCase();
  const unsubscribe = values.subscribe(location, (value) => {
    res.write(`data: ${JSON.stringify(value)}\n\n`);
  });
  res.on("close", () => {
    unsubscribe();
  });
});

app.post("/message", async (req, res) => {
  if (!req.token) {
    res.writeHead(403).end("not authorized");
  }
  const value = req.body.value;
  if (value) {
    values.add(req.token, value);
  }
  res.writeHead(200).end();
});

app.delete("/message", async (req, res) => {
  if (!req.token) {
    res.writeHead(403).end("not authorized");
  }
  const value = req.body.value;
  if (value) {
    values.remove(req.token, value);
  }
  res.writeHead(200).end();
});

app.get("/assets/*", (req, res) => {
  const filename = "./public" + req.url;
  const fileStream = createReadStream(filename);
  const contentType = filename.endsWith(".css")
    ? "text/style"
    : "application/javascript";
  res.writeHead(200, {
    "content-type": contentType,
  });
  fileStream.pipe(res);
});

app.use(app);

export { app };
