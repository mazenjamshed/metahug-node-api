const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  ScanCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE;
const ANYTHING_TABLE = process.env.ANYTHING_TABLE;
const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.post("/users/rating", async (req, res) => {
  const payload = req.body;

  const {
    roblox_username,
    game_tutorial,
    experience_gameplay,
    continue_playing,
    multiplayer_experience,
    laggy,
    attention_time,
    mobile_support,
    game_graphic,
    bugs,
    ui_design,
    challenging,
    controls,
    intrusive_prompts,
    freetoplay_experience,
    experience_id,
    future_updates,
    age,
    country,
    discord,
    which_game,
    gender,
    image_url,
  } = payload;

  if (
    !roblox_username ||
    ![
      game_tutorial,
      experience_gameplay,
      continue_playing,
      multiplayer_experience,
      laggy,
      attention_time,
      mobile_support,
      game_graphic,
      bugs,
      ui_design,
      challenging,
      controls,
      intrusive_prompts,
      freetoplay_experience,
    ].every((rating) => rating !== undefined)
  ) {
    return res.status(400).json({
      error:
        'Please provide a valid "roblox_username" and all rating attributes',
    });
  }

  const ratings = [
    game_tutorial,
    experience_gameplay,
    continue_playing,
    multiplayer_experience,
    laggy,
    attention_time,
    mobile_support,
    game_graphic,
    bugs,
    ui_design,
    challenging,
    controls,
    intrusive_prompts,
    freetoplay_experience,
  ];

  const average_rating =
    ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

  const item = {
    userId: roblox_username,
    average_rating: average_rating.toString(),
    experience_id,
    future_updates,
    age: age.toString(),
    country,
    discord,
    which_game,
    image_url,
    gender,
    isApproved: false,
  };

  try {
    await dynamoDbClient.send(
      new PutCommand({ TableName: USERS_TABLE, Item: item })
    );
    res.json(item);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.post("/users/:user_id/approve", async (req, res) => {
  const { user_id } = req.params;

  const updateParams = {
    TableName: USERS_TABLE,
    Key: { userId: user_id },
    UpdateExpression: "SET isApproved = :val",
    ExpressionAttributeValues: { ":val": true },
  };

  try {
    await dynamoDbClient.send(new UpdateCommand(updateParams));
    res.json({ message: `User ${user_id} has been approved` });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.get("/users/unapproved", async (req, res) => {
  const scanParams = {
    TableName: USERS_TABLE,
    FilterExpression: "isApproved = :val",
    ExpressionAttributeValues: { ":val": false },
  };

  try {
    const response = await dynamoDbClient.send(new ScanCommand(scanParams));

    const unapproved_users = response.Items.map((item) => ({
      average_rating: parseFloat(item.average_rating),
      future_updates: item.future_updates,

      which_game: item.which_game,
      image_url: item.image_url,
      userId: item.userId,

      data: {
        gender: item.gender,
        age: item.age,
        country: item.country,
        discord: item.discord,
        experience_id: item.experience_id,
      },
    }));

    res.json(unapproved_users);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.post("/users/unapproved", async (req, res) => {
  const scanParams = {
    TableName: USERS_TABLE,
    FilterExpression: "isApproved = :val",
    ExpressionAttributeValues: { ":val": false },
  };

  try {
    const response = await dynamoDbClient.send(new ScanCommand(scanParams));

    const unapproved_users = response.Items.map((item) => ({
      average_rating: parseFloat(item.average_rating),
      future_updates: item.future_updates,

      which_game: item.which_game,
      image_url: item.image_url,
      userId: item.userId,

      data: {
        gender: item.gender,
        age: item.age,
        country: item.country,
        discord: item.discord,
        experience_id: item.experience_id,
      },
    }));

    res.json(unapproved_users);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.get("/users/all-approved", async (req, res) => {
  const scanParams = {
    TableName: USERS_TABLE,
    FilterExpression: "isApproved = :val",
    ExpressionAttributeValues: { ":val": true },
  };

  try {
    const response = await dynamoDbClient.send(new ScanCommand(scanParams));

    const approved_users = response.Items.map((item) => ({
      average_rating: parseFloat(item.average_rating),
      experience_id: item.experience_id,
      image_url: item.image_url,
    }));

    res.json(approved_users);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.delete("/users/delete-all", async (req, res) => {
  try {
    const response = await dynamoDbClient.send(
      new ScanCommand({ TableName: USERS_TABLE })
    );

    const deletePromises = response.Items.map((item) =>
      dynamoDbClient.send(
        new DeleteCommand({
          TableName: USERS_TABLE,
          Key: { userId: item.userId },
        })
      )
    );

    await Promise.all(deletePromises);

    res.json({ message: "All users have been deleted" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.post("/users/:user_id/reject", async (req, res) => {
  const { user_id } = req.params;

  const updateParams = {
    TableName: USERS_TABLE,
    Key: { userId: user_id },
    UpdateExpression: "SET isRejected = :val",
    ExpressionAttributeValues: { ":val": true },
  };

  try {
    await dynamoDbClient.send(new UpdateCommand(updateParams));
    res.json({ message: `User ${user_id} has been rejected` });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.post("/questions/addQuestion", async (req, res) => {
  const payload = req.body;

  try {
    await dynamoDbClient.send(
      new PutCommand({ TableName: QUESTIONS_TABLE, Item: payload })
    );
    res.json(payload);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.get("/questions/getAllQuestions", async (req, res) => {
  const scanParams = {
    TableName: QUESTIONS_TABLE,
  };

  try {
    const response = await dynamoDbClient.send(new ScanCommand(scanParams));
    res.json(response.Items);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.post("/post", async (req, res) => {
  const payload = req.body;

  try {
    await dynamoDbClient.send(
      new PutCommand({ TableName: ANYTHING_TABLE, Item: payload })
    );
    res.json(payload);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.get("/getAll", async (req, res) => {
  const scanParams = {
    TableName: ANYTHING_TABLE,
  };

  try {
    const response = await dynamoDbClient.send(new ScanCommand(scanParams));
    res.json(response.Items);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

module.exports.handler = serverless(app);
