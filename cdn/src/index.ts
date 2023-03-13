import Express, { Response } from "express";
import cors from "cors";
import config from "@/config";
import morgan from "morgan";
import * as s3 from "@/services/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const app = Express();

app.use(cors());
app.use(morgan("dev"));

async function pipe(Key: string, res: Response) {
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key,
  });

  const response = await s3.client.send(command);

  res.set("Content-Type", response.ContentType);
  res.set("Content-Length", response.ContentLength?.toString());
  res.set("ETag", response.ETag);
  res.set("Last-Modified", response.LastModified?.toString());

  const readableStream = response.Body!.transformToWebStream();

  const writeableStream = new WritableStream({
    write(chunk) {
      res.write(chunk);
    },
    close() {
      res.end();
    },
  });

  readableStream.pipeTo(writeableStream);
}

app.get("/lores/:id/image", async (req, res) => {
  try {
    await pipe(`lores/${req.params.id}/image`, res);
  } catch (e: any) {
    console.warn(e.message);
    res.status(404).send(e.message);
  }
});

app.get("/chars/:id/image", async (req, res) => {
  try {
    await pipe(`chars/${req.params.id}/image`, res);
  } catch (e: any) {
    console.warn(e.message);
    res.status(404).send(e.message);
  }
});

app.listen(config.server.port, config.server.host, () => {
  console.log(
    `Server listening at http://${config.server.host}:${config.server.port}`
  );
});
