const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  ScanCommand,
  DeleteCommand,
  QueryCommand,
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

app.get("/user/:userId(*)", async (req, res) => {
  const { userId } = req.params;

  const getParams = {
    TableName: USERS_TABLE,
    Key: { userId },
  };

  try {
    const response = await dynamoDbClient.send(new GetCommand(getParams));

    if (!response.Item) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(response.Item);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});


app.post("/questions/addQuestion/:userId", async (req, res) => {
  const { userId } = req.params;
  const payload = req.body;

  const item = {
    ...payload,
    userId,
    approved: "pending",
    questionId: `${Date.now()}`, // You can modify this to any unique identifier logic you like
  };

  try {
    await dynamoDbClient.send(
      new PutCommand({ TableName: QUESTIONS_TABLE, Item: item })
    );
    res.json(item);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.get("/questions/getAllQuestions/:userId", async (req, res) => {
  const { userId } = req.params;

  const queryParams = {
    TableName: QUESTIONS_TABLE,
    KeyConditionExpression: "userId = :userIdValue",
    ExpressionAttributeValues: { ":userIdValue": userId },
  };

  try {
    const response = await dynamoDbClient.send(new QueryCommand(queryParams));
    res.json(response.Items);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.put("/questions/:userId/approve", async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch all questions for the userId
    const queryParams = {
      TableName: QUESTIONS_TABLE,
      KeyConditionExpression: "userId = :userIdValue",
      ExpressionAttributeValues: {
        ":userIdValue": userId,
      },
    };

    const results = await dynamoDbClient.send(new QueryCommand(queryParams));

    // Update all fetched questions to be approved
    const updatePromises = results.Items.map((question) => {
      const updateParams = {
        TableName: QUESTIONS_TABLE,
        Key: {
          userId,
          questionId: question.questionId,
        },
        UpdateExpression: "SET approved = :value",
        ExpressionAttributeValues: {
          ":value": "approved",
        },
      };

      return dynamoDbClient.send(new UpdateCommand(updateParams));
    });

    await Promise.all(updatePromises);
    res.json({ message: "All questions for the user approved successfully!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

app.put("/questions/:userId/reject", async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch all questions for the userId
    const queryParams = {
      TableName: QUESTIONS_TABLE,
      KeyConditionExpression: "userId = :userIdValue",
      ExpressionAttributeValues: {
        ":userIdValue": userId,
      },
    };

    const results = await dynamoDbClient.send(new QueryCommand(queryParams));

    // Update all fetched questions to be rejected
    const updatePromises = results.Items.map((question) => {
      const updateParams = {
        TableName: QUESTIONS_TABLE,
        Key: {
          userId,
          questionId: question.questionId,
        },
        UpdateExpression: "SET approved = :value",
        ExpressionAttributeValues: {
          ":value": "rejected",
        },
      };

      return dynamoDbClient.send(new UpdateCommand(updateParams));
    });

    await Promise.all(updatePromises);
    res.json({ message: "All questions for the user rejected successfully!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});

const formatResponse = (items) => {
  const groupedByUserId = items.reduce((acc, question) => {
    if (acc[question.userId]) {
      acc[question.userId].push(question);
    } else {
      acc[question.userId] = [question];
    }
    return acc;
  }, {});

  return Object.entries(groupedByUserId).map(([userID, questions]) => ({
    userID,
    data: questions,
  }));
};

// Endpoint for Pending questions
app.get("/getAllQuestions/pending", async (req, res) => {
  const scanParams = {
    TableName: QUESTIONS_TABLE,
    FilterExpression: "#approved = :value",
    ExpressionAttributeNames: {
      "#approved": "approved",
    },
    ExpressionAttributeValues: {
      ":value": "pending",
    },
  };

  try {
    const scanResult = await dynamoDbClient.send(new ScanCommand(scanParams));
    res.json(formatResponse(scanResult.Items));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching pending questions" });
  }
});

// Endpoint for Approved questions
app.get("/getAllQuestions/approved", async (req, res) => {
  const scanParams = {
    TableName: QUESTIONS_TABLE,
    FilterExpression: "#approved = :value",
    ExpressionAttributeNames: {
      "#approved": "approved",
    },
    ExpressionAttributeValues: {
      ":value": "approved",
    },
  };

  try {
    const scanResult = await dynamoDbClient.send(new ScanCommand(scanParams));
    res.json(formatResponse(scanResult.Items));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching approved questions" });
  }
});

// Endpoint for Rejected questions
app.get("/getAllQuestions/rejected", async (req, res) => {
  const scanParams = {
    TableName: QUESTIONS_TABLE,
    FilterExpression: "#approved = :value",
    ExpressionAttributeNames: {
      "#approved": "approved",
    },
    ExpressionAttributeValues: {
      ":value": "rejected",
    },
  };

  try {
    const scanResult = await dynamoDbClient.send(new ScanCommand(scanParams));
    res.json(formatResponse(scanResult.Items));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching rejected questions" });
  }
});

app.delete("/questions/deleteAllQuestions/:userId", async (req, res) => {
  const { userId } = req.params;

  // Step 1: Query the table to get all questions of the specific user
  const queryParams = {
    TableName: QUESTIONS_TABLE,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  };

  try {
    const queryResult = await dynamoDbClient.send(
      new QueryCommand(queryParams)
    );
    const itemsToDelete = queryResult.Items;

    if (itemsToDelete && itemsToDelete.length > 0) {
      for (let item of itemsToDelete) {
        const deleteParams = {
          TableName: QUESTIONS_TABLE,
          Key: {
            userId: userId,
            questionId: item.questionId,
          },
        };
        // Step 2: Delete each question
        await dynamoDbClient.send(new DeleteCommand(deleteParams));
      }
    }

    res.json({ message: `All questions for user ${userId} have been deleted` });
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





app.get("/questions/reward/:userId", async (req, res) => {
  const { userId } = req.params;

  // Define the reward questions with options
  const rewardQuestions = [
    {
      question: "Are you satisfied with the in-game progression system and rewards?",
      options: ["Very satisfied", "Satisfied", "Neutral", "Unsatisfied", "Very unsatisfied"],
      questionId: "q1",
    },
    {
      question: "Which aspect of the game's progression system do you appreciate the most?",
      options: ["Character progression", "Unlockable content", "Achievements", "Skill progression", "Other"],
      questionId: "q2",
    },
    {
      question: "Do you feel a sense of achievement when you reach milestones or earn rewards in the game?",
      options: ["Yes, always", "Yes, sometimes", "No, not really", "Not sure"],
      questionId: "q3",
    },
    {
      question: "How do you rate the balance between challenging tasks and rewarding outcomes in the game?",
      options: ["Well-balanced", "Too easy to earn rewards", "Too difficult to earn rewards", "Not sure"],
      questionId: "q4",
    },
    {
      question: "Are there any specific in-game achievements or trophies that you're actively pursuing?",
      options: ["Yes", "No", "Not sure"],
      questionId: "q5",
    },
    {
      question: "Do you feel that the in-game economy (e.g., currency, items) is balanced and fair?",
      options: ["Yes", "No", "Not sure"],
      questionId: "q6",
    },
    {
      question: "Are you motivated to continue playing in order to achieve specific in-game goals or milestones?",
      options: ["Highly motivated", "Moderately motivated", "Not very motivated", "Not motivated at all"],
      questionId: "q7",
    },
    {
      question: "Would you like to see more variety in the types of rewards offered in the game?",
      options: ["Yes", "No", "Not sure"],
      questionId: "q8",
    },

    {
      question: "Do you have any suggestions for improving the game's progression system or rewards?",
      options: ["Yes", "No"],
      questionId: "q9",
    },
    {
      question: "Overall, how satisfied are you with the game's progression and reward system?",
      options: ["Very satisfied", "Satisfied", "Neutral", "Unsatisfied", "Very unsatisfied"],
      questionId: "q10",
    },
  ];

  try {
    const queryParams = {
      TableName: QUESTIONS_TABLE,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const queryResult = await dynamoDbClient.send(new QueryCommand(queryParams));


    const userResponses = queryResult.Items;

    const questionsWithResponses = rewardQuestions.map((question) => {
      const userResponse = userResponses.find(response => response.questionId === question.questionId);
      return {
        ...question,
        userResponse: userResponse ? userResponse.answer : null,
      };
    });


    res.json(questionsWithResponses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while processing your request" });
  }
});

app.post("/questions/reward/response/:userId", async (req, res) => {
  const { userId } = req.params;
  const responses = req.body; // Assuming the body contains an array of { question, answer }

  try {
    // Process each response
    const responsePromises = responses.map(response => {
      const putParams = {
        TableName: QUESTIONS_TABLE,
        Item: {
          userId,
          questionId: response.questionId, // Unique identifier for the question
          answer: response.answer
        }
      };
      return dynamoDbClient.send(new PutCommand(putParams));
    });

    await Promise.all(responsePromises);
    res.json({ message: "Responses recorded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while processing your request" });
  }
});



module.exports.handler = serverless(app);
