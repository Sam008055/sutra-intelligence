import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processDocument } from "@/lib/inngest/functions";

export const maxDuration = 60;

// Create an API that serves zero-downtime background jobs
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processDocument,
  ],
});
