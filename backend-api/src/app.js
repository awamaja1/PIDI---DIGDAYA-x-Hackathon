const express = require("express");

const apiV1Router = require("./api/routes");
const snapRouter = require("./api/routes/snap");
const mockRouter = require("./api/routes/mock");
const { correlationIdMiddleware } = require("./middleware/correlationId");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(express.json());
app.use(correlationIdMiddleware);

app.use("/api/v1", apiV1Router);
app.use("/api/snap", snapRouter);
app.use("/api/v1/mock", mockRouter);
app.use("/mock", mockRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = {
  app,
};
