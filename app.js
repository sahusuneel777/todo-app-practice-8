const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

let db = null;
const dataPath = path.join(__dirname, "todoApplication.db");
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dataPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error :${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

///1 get todos based on Queries API
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let getTodosQuery = "";

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE 
                todo LIKE '${search_q}', 
                AND priority = '${priority}',
                AND status = '${status}'
                `;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE 
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE 
            todo LIKE '%${search_q}%'`;
  }
  const data = await db.all(getTodosQuery);
  response.send(data);
});

//2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT 
        *
    FROM 
        todo
    WHERE 
        id=${todoId};`;
  const todo = await db.all(getTodoQuery);
  response.send(todo);
});

///3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const createNewTodoQuery = `
    INSERT INTO
    todo (id,todo,priority,status)
    VALUES
    (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(createNewTodoQuery);
  response.send("Todo Successfully Added");
});

///4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  let updateTodoQuery = "";

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      updateTodoQuery = `
        UPDATE
        todo
        SET
        status='${requestBody.status}'
        WHERE
        id = ${todoId};`;
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      updateTodoQuery = `
        UPDATE
        todo
        SET
        priority='${requestBody.priority}'
        WHERE
        id = ${todoId};`;
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      updateTodoQuery = `
        UPDATE
        todo
        SET
        todo='${requestBody.todo}'
        WHERE
        id = ${todoId};`;
      break;
  }

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

///5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
