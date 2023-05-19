export const invalidCredentials = () => {
  return new Response(
    JSON.stringify({
      message: "Invalid password",
    }),
    {
      status: 403,
      headers: {
        "content-type": "application/json",
      },
    }
  );
};
