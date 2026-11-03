import './instrument';
import express from 'express';
import { resolve } from 'node:path';
import { getClientIp } from './client-ip';
import { prisma } from './db';
import * as Sentry from '@sentry/node';

const app = express();
const port = process.env.PORT || 3333;

app.set('views', resolve('app/pages'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));

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
        ipAddr: getClientIp(req),
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

app.get('/edit.css', (_req, res) => {
  res.sendFile(resolve('app/pages/edit.css'));
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

  res.render('edit', { redirectUrl: link?.redirectUrl || '', hitCount });
});

app.post('/edit', async (req, res) => {
  const hostname = req.hostname;
  const { redirectUrl, password } = req.body || {};

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

Sentry.setupExpressErrorHandler(app);

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
