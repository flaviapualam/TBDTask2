const pool = require("../../db");
const queries = require("./queries");

// get all books
const getBooks = (req, res) => {
  pool.query(queries.getBooks, (error, results) => {
    if (error) throw error;
    res.status(200).json(results.rows);
  });
};

// get book by book id
const getBookById = (req, res) => {
  const id = parseInt(req.params.id);
  pool.query(queries.getBookById, [id], (error, results) => {
    if (error) throw error;
    res.status(200).json(results.rows);
  });
};

// add  new book
const addBook = (req, res) => {
  const { BookID, BookTitle, PublicationYear, Pages, PublisherID, LanguageID } =
    req.body;
  pool.query(queries.checkBookexists, [BookTitle], (error, results) => {
    if (results.rows.length) {
      res.status(200).send("Book already exist.");
    }
    pool.query(
      queries.addBook,
      [BookID, BookTitle, PublicationYear, Pages, PublisherID, LanguageID],
      (error, results) => {
        if (error) throw error;
        res.status(201).send("Book created successfully.");
      }
    );
  });
};

// delete book
const removeBook = (req, res) => {
  const id = parseInt(req.params.id);
  pool.query(queries.getBookById, [id], (error, results) => {
    const noBookFound = !results.rows.length;
    if (noBookFound) {
      res.status(201).send("Book does not exist.");
    }
    pool.query(queries.removeBook, [id], (error, results) => {
      if (error) throw error;
      res.status(200).send("Book removed successfully.");
    });
  });
};

// update book
const updateBook = (req, res) => {
  const id = parseInt(req.params.id);
  const { BookTitle, PublicationYear, Pages, PublisherID, LanguageID } =
    req.body;

  pool.query(queries.getBookById, [id], (error, results) => {
    const noBookFound = !results.rows.length;
    if (noBookFound) {
      res.status(201).send("Book does not exist.");
    }

    pool.query(
      queries.updateBook,
      [BookTitle, PublicationYear, Pages, PublisherID, LanguageID, id],
      (error, results) => {
        if (error) throw error;
        res.status(200).send("Book updated successfully.");
      }
    );
  });
};

//get membership by customer id
const getMembershipByCustId = (req, res) => {
  const id = parseInt(req.params.id);
  pool.query(queries.getMembershipByCustId, [id], (error, results) => {
    if (error) throw error;
    res.status(200).json(results.rows);
  });
};

// Add Membership
const addMembership = (req, res) => {
  const {
    MembershipID,
    MembershipDuration,
    CustomerID,
    CustomerName,
    Street,
    City,
    State,
    Country,
  } = req.body;
  if (
    !MembershipID ||
    !MembershipDuration ||
    !CustomerID ||
    !CustomerName ||
    !Street ||
    !City ||
    !State ||
    !Country
  ) {
    return res.status(200).send("missing required fields");
  }
  pool.connect((err, client, done) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(200).send("Database connection error.");
    }

    //check if membership exist
    client.query(
      queries.checkMembershipexist,
      [CustomerID],
      (error, results) => {
        if (err) {
          done();
          console.error("Error checking book name existence:", err);
          return res.status(200).send("An error occurred.");
        }
        if (results.rows.length) {
          done();
          return res.status(400).send("Membership already exists.");
        }
        // add new customer and membership
        client.query(
          queries.addCustomer,
          [CustomerID, CustomerName, Street, City, State, Country],
          (err, results) => {
            done(); // Release the client back to the pool
            if (err) {
              console.error("Error adding stock:", err);
              return res.status(500).send("An error occurred.");
            }
            //create new membership for the customer
            client.query(
              queries.addMembership,
              [MembershipID, MembershipDuration, CustomerID],
              (error, results) => {
                if (err) {
                  done();
                  console.error("Error adding book:", err);
                  return res.status(500).send("An error occurred.");
                }
              }
            );
            res
              .status(201)
              .send(`Membership added successfully with ID: ${MembershipID}`);
          }
        );
      }
    );
  });
};

// delete membership
const removeMembership = (req, res) => {
  const id = parseInt(req.params.id);
  pool.query(queries.getMembershipByCustId, [id], (error, results) => {
    const noMembershipFound = !results.rows.length;
    if (noMembershipFound) {
      res.status(201).send("Membership does not exist for this customer.");
    }
    pool.query(queries.removeMembership, [id], (error, results) => {
      if (error) throw error;
      res.status(200).send("Membership removed successfully.");
    });
  });
};

// build query
const buildQuery = (req, res) => {
  const { filters, sort, limit, offset } = req.body;
  // Query base
  let query =
    'SELECT b.*, i."Quantity" FROM "Inventory" i LEFT JOIN "Book" b ON b."BookID" = i."BookID"';
  let queryParams = [];
  let queryConditions = [];

  // Filters Query
  if (filters) {
    Object.keys(filters).forEach((key, index) => {
      if (typeof filters[key] === "object") {
        Object.keys(filters[key]).forEach((condition) => {
          let paramIndex = queryParams.length + 1;
          switch (condition) {
            case "gte":
              queryConditions.push(`"${key}" >= $${paramIndex}`);
              queryParams.push(filters[key][condition]);
              break;
            case "lte":
              queryConditions.push(`"${key}" <= $${paramIndex}`);
              queryParams.push(filters[key][condition]);
              break;
          }
        });
      } else {
        let paramIndex = queryParams.length + 1;
        queryConditions.push(`"${key}" = $${paramIndex}`);
        queryParams.push(filters[key]);
      }
    });
  }

  // Combine conditions with WHERE clause
  if (queryConditions.length > 0) {
    query += ` WHERE ${queryConditions.join(" AND ")}`;
  }

  // Sort Query
  if (sort) {
    query += ` ORDER BY "${sort.column}" ${sort.direction}`;
  }

  // Limit Query
  if (limit) {
    queryParams.push(limit);
    query += ` LIMIT $${queryParams.length}`;
  }

  // Execute the Built Query
  pool.query(query, queryParams, (error, results) => {
    if (error) throw error;
    res.status(200).json(results.rows);
  });
};

// tcl for add quantity in inventory and reducing stocks from supplier
const InventoryUpdate = (req, res) => {
  const { BookID, StoreID, SupplierID, Quantity } = req.body;

  pool.connect((err, client, done) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).send("Database connection error.");
    }

    const handleError = (err) => {
      client.query("ROLLBACK", (rollbackErr) => {
        done();
        if (rollbackErr) {
          console.error("Rollback error:", rollbackErr);
        }
        console.error("Error in transaction:", err);
        res.status(500).send("An error occurred.");
      });
    };

    client.query("BEGIN", (err) => {
      if (err) return handleError(err);

      // Query to add the quantity to the inventory
      client.query(
        queries.updateQuantity,
        [Quantity, BookID, StoreID],
        (err, results) => {
          if (err) return handleError(err);

          // Query to reduce the stock from the supplier
          client.query(
            queries.reduceStock,
            [Quantity, BookID, SupplierID],
            (err, results) => {
              if (err) return handleError(err);

              client.query("COMMIT", (err) => {
                if (err) return handleError(err);
                done();
                res
                  .status(200)
                  .send(
                    "Inventory updated and supplier stock reduced successfully."
                  );
              });
            }
          );
        }
      );
    });
  });
};

module.exports = {
  getBooks,
  getBookById,
  addBook,
  removeBook,
  updateBook,
  addMembership,
  removeMembership,
  buildQuery,
  getMembershipByCustId,
  InventoryUpdate,
};
