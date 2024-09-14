import express from "express";

const app = express();

app.listen(process.env.PORT ?? 3000);
console.log(`Sky Alarm is listening on ${process.env.PORT ?? 3000}`);
