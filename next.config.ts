import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  // Vercel uploads only the files a route is traced to use, and the trace misses two the PDF step reads at run time:
  // playwright-core's browsers.json (without it every page fails to load) and the Chromium build in
  // @sparticuz/chromium/bin.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/playwright-core/browsers.json", "./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default withWorkflow(nextConfig);
