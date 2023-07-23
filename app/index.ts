import express from 'express';
import bodyParser from 'body-parser';
import requestIp from 'request-ip';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3333;

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));

app.get('/healthcheck', async (_req, res) => {
  console.log('Healthcheck hit.');
  // Make sure we can hit DB.
  await prisma.shortLink.findFirst();
  res.status(200).send('OK');
});

app.get('/', async (req, res) => {
  const link = await prisma.shortLink.findUnique({
    where: {
      host: req.hostname,
    },
  });

  if (link) {
    await prisma.hit.create({
      data: {
        userAgent: req.headers['user-agent'] || null,
        ipAddr: requestIp.getClientIp(req) || null,
        referer: req.headers['referer'] || null,
        rawHeaders: JSON.stringify(req.headers),
        linkId: link.linkId,
      },
    });

    res.redirect(302, link.redirectUrl);
  } else {
    res.status(200).send(`link does not exist for ${req.hostname}`);
  }
});

app.get('/count', async (req, res) => {
  const hitCount = await prisma.hit.count({
    where: {
      shortLink: { host: req.hostname },
    },
  });

  if (hitCount > 0) {
    res.send('' + hitCount);
  } else {
    res.status(404).send('Not found');
  }
});

app.get('/last/:count', async (req, res) => {
  let count = parseInt(req.params.count, 10);
  count = isNaN(count) ? 10 : count;

  const hits = await prisma.hit.findMany({
    select: {
      userAgent: true,
      ipAddr: true,
      referer: true,
      createdAt: true,
    },
    where: {
      shortLink: { host: req.hostname },
    },
    take: count,
    orderBy: { createdAt: 'desc' },
  });

  res.send(hits);
});

app.get('/edit', async (req, res) => {
  const link = await prisma.shortLink.findUnique({
    where: {
      host: req.hostname,
    },
  });

  const hitCount = link
    ? await prisma.hit.count({
        where: {
          linkId: link.linkId,
        },
      })
    : 0;

  res.send(`<form method="post" action="" onsubmit="navigator.clipboard.writeText('https://' + window.location.host)">
      <label>Redirect URL
        <input type="text" name="redirectUrl" value="${
          (link && link.redirectUrl) || ''
        }">
      </label>
      <label>Password
        <input type="password" name="password">
      </label>
      <button type="submit">Submit</button>
    </form>
    <p>This link has been visited ${hitCount} times.</p>`);
});

app.post('/edit', async (req, res) => {
  const hostname = req.hostname;
  const { redirectUrl, password } = req.body;

  if (redirectUrl && password === process.env.EDIT_PASSWORD) {
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
