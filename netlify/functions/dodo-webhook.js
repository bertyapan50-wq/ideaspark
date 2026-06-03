export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // TEMP: Log ALL headers to see what Dodo is sending
  const headers = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });
  console.log("ALL HEADERS:", JSON.stringify(headers, null, 2));

  const rawBody = await req.text();
  console.log("BODY PREVIEW:", rawBody.slice(0, 200));

  return new Response("ok", { status: 200 });
};