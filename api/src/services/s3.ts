import config from "@/config";
import { S3Client } from "@aws-sdk/client-s3";

export const client = new S3Client({
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  region: config.s3.region,
  endpoint: config.s3.endpoint.toString(),
});

export default client;
