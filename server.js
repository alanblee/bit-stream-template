const { Client, auth } = require("twitter-api-sdk");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const authClient = new auth.OAuth2User({
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  callback: process.env.REDIRECT_URI,
  scopes: ["tweet.read", "users.read", "tweet.write", "offline.access"],
});

const twitterClient = new Client(authClient);

const STATE = new Date().getTime() * (1 + Math.random());

let tokens = {};

app.get("/login", async function (req, res) {
  const authUrl = authClient.generateAuthURL({
    state: STATE.toString(),
    code_challenge_method: "s256",
  });
  res.redirect(authUrl);
});

app.get("/callback", async function (req, res) {
  try {
    const { code, state } = req.query;

    if (state !== STATE.toString())
      return res.status(500).send("State isn't matching");
    const {
      token: { access_token, refresh_token },
    } = await authClient.requestAccessToken(code);

    tokens = {
      access_token,
      refresh_token,
    };
    res.redirect("/bot");
  } catch (error) {
    console.log(error);
  }
});

app.get("/bot", async function (req, res) {
  try {
    // Add cron job here

    // Refresh token first
    const {
      token: { access_token, refresh_token },
    } = await authClient.refreshAccessToken();
    tokens = {
      access_token,
      refresh_token,
    };

    //What do you want your bot to do?
    const postTweet = await twitterClient.tweets.createTweet({
      // The text of the Tweet
      text: "Hello from TwitterDev stream!",
    });
    res.send(postTweet);
  } catch (error) {
    console.log("error", error);
  }
});

app.get("/revoke", async function (req, res) {
  try {
    const response = await authClient.revokeAccessToken();
    res.send(response);
  } catch (error) {
    console.log(error);
  }
});

app.listen(5000, () => {
  console.log(`Go here to login: http://127.0.0.1:5000/login`);
});
