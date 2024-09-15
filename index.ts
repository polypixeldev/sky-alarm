import express from "express";
import jsdom from "jsdom";

const app = express();

type Event = {
  date: Date;
  description: string;
};

let yearEvents: Event[] = [];

function isDST(d: Date) {
  let jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
  let jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
  return Math.max(jan, jul) !== d.getTimezoneOffset();
}

async function refresh() {
  const date = new Date();

  // Sky Event Almanacs Courtesy of Fred Espenak, www.AstroPixels.com
  const data = await fetch(
    `https://astropixels.com/almanac/almanac21/almanac${date.getFullYear()}est.html`,
  ).then((r) => r.text());
  const dom = new jsdom.JSDOM(data);
  const pres = [...dom.window.document.querySelectorAll("pre").values()].slice(
    0,
    2,
  );

  let month = 0;
  for (const pre of pres) {
    const months = pre.innerHTML.split("\n\n").slice(1);

    for (const monthData of months) {
      for (const event of monthData.split("\n")) {
        const eventMonth = event.slice(0, 3);
        const eventDay = event.slice(4, 6);
        const eventTime = event.slice(8, 13).trim();

        const eventDate = new Date();
        eventDate.setMonth(month);
        eventDate.setDate(parseInt(eventDay));
        const dst = Number(isDST(new Date()));
        eventDate.setHours(parseInt(eventTime.split(":")[0]) + dst);
        eventDate.setMinutes(parseInt(eventTime.split(":")[1] ?? 0));
        eventDate.setSeconds(0);

        const eventDesc = event.slice(15).trim();

        yearEvents.push({
          date: eventDate,
          description: eventDesc,
        });
      }

      month++;
    }
  }
}

app.get("/refresh", async (req, res) => {
  await refresh();
  return res.sendStatus(200);
});

app.get("/alerts", async (req, res) => {
  let alerts: Event[] = [];

  for (const event of yearEvents) {
    const eventMillis = event.date.valueOf();
    const nowMillis = new Date().valueOf();
    if (Math.abs(eventMillis - nowMillis) < 60 * 1000) {
      alerts.push(event);
    }
  }

  // testing: add random event
  alerts.push(yearEvents[Math.floor(Math.random() * yearEvents.length)]);

  return res.json(alerts);
});

refresh().then(() => {
  app.listen(process.env.PORT ?? 3000);
  console.log(`Sky Alarm is listening on ${process.env.PORT ?? 3000}`);
});
