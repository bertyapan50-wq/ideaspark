export default async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { productId, userEmail, userName, returnUrl } = await req.json();

    if (!process.env.DODO_API_KEY) {
      throw new Error("Missing DODO_API_KEY in environment variables");
    }

    const response = await fetch("https://test.dodopayments.com/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DODO_API_KEY}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: {
          email: userEmail,
          name: userName || userEmail,
        },
        return_url: returnUrl,
      }),
    });

    const text = await response.text(); // safer than json()

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("CREATE CHECKOUT ERROR:", err);

    return new Response(
      JSON.stringify({
        error: err.message,
      }),
      { status: 500 }
    );
  }
};