import express from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3333;

app.use(bodyParser.urlencoded({extended: false}));

app.get('/healthcheck', (_req, res) => {
  res.send('hello world');
});

app.get('/', async (req, res) => {
  const link = await prisma.shortLink.findUnique({
    where: {
      host: req.hostname,
    },
  });

  if (link) {
    // TODO: log the hit

    res.send(`redirecting to ${link.redirectUrl}`);
  } else {
    res.send(`link does not exist for ${req.hostname}`);
  }
});

app.get('/edit', async (req, res) => {
  const link = await prisma.shortLink.findUnique({
    where: {
      host: req.hostname,
    },
  });

  res.send(`<form method="post" action="" onsubmit="navigator.clipboard.writeText('https://' + window.location.host)">
      <label>Redirect URL
        <input type="text" name="redirectUrl" value="${link && link.redirectUrl || ''}">
      </label>
      <label>Password
        <input type="password" name="password">
      </label>
      <button type="submit">Submit</button>
    </form>`);
});

app.post('/edit', async (req, res) => {
  const hostname = req.hostname;
  const {
    redirectUrl,
    password,
  } = req.body;

  if (redirectUrl && password === 'TESTING') {
    const link = await prisma.shortLink.upsert({
      where: {
        host: hostname,
      },
      update: { redirectUrl },
      create: {
        host: hostname,
        redirectUrl,
      },
    });

    res.redirect(link.redirectUrl);
  } else {
    res.send('wrong password');
  }
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
