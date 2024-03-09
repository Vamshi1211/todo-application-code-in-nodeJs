const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server is running at 3000 port"));
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

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

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
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
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoByTodoIdQuery = `SELECT * FROM todo 
                                    WHERE id = ${todoId};`;
  const getTodoByIdResponse = await database.get(getTodoByTodoIdQuery);
  response.send(getTodoByIdResponse);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const addTodoQuery = `INSERT INTO todo(id, todo, priority, status) 
                            VALUES
                                (
                                    ${id},
                                    '${todo}',
                                    '${priority}',
                                    '${status}'
                                );`;
  const getResponseOfAddTodo = await database.run(addTodoQuery);
  const getResponseOfNewTodoId = getResponseOfAddTodo.lastID;
  //response.send(getResponseOfAddTodo);
  response.send("Todo Successfully Added");
});

const getStatus = (todoDetails) => {
  return todoDetails.status !== undefined;
};

const getPriority = (todoDetails) => {
  return todoDetails.priority !== undefined;
};

const getTodo = (todoDetails) => {
  return todoDetails.todo !== undefined;
};

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const { status, priority, todo } = request.body;

  //console.log(status);

  let query = "";
  let result = "";

  switch (true) {
    case getStatus(request.body):
      query = `UPDATE todo 
                        SET status = '${status}'
                        WHERE id = ${todoId};`;
      result = "Status Updated";
      break;
    case getPriority(request.body):
      query = `UPDATE todo 
                        SET priority = '${priority}'
                        WHERE id = ${todoId};`;
      result = "Priority Updated";
      break;
    case getTodo(request.body):
      query = `UPDATE todo 
                        SET todo = '${todo}'
                        WHERE id = ${todoId};`;
      result = "Todo Updated";
      break;
    default:
      result = "Please Provide Valid Data";
  }

  const updateResponse = await database.run(query);
  response.send(result);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  const deleteResponse = await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
