const getBooks = 
    'SELECT * FROM "Book"';

const getBookById =
    'SELECT * FROM "Book" WHERE "BookID" = $1';

const checkBookexists =
    'SELECT b FROM "Book" b WHERE b."BookTitle" = $1';

const addBook =
    'INSERT INTO "Book" ("BookID", "BookTitle", "PublicationYear", "Pages", "PublisherID", "LanguageID") VALUES ($1, $2, $3, $4, $5, $6)'; 

const removeBook =
    'DELETE FROM "Book" WHERE "BookID" = $1';

const updateBook =
    'UPDATE "Book" SET "BookTitle" = $1, "PublicationYear" = $2, "Pages" = $3, "PublisherID" = $4, "LanguageID" = $5  WHERE "BookID" = $6';

const updateQuantity =
    'UPDATE "Inventory" SET "Quantity" = "Quantity" + $1 WHERE "BookID" = $2 AND "StoreID" = $3';

const reduceStock =
    'UPDATE "Supplier" SET "Stock" = "Stock" - $1 WHERE "BookID" = $2 AND "SupplierID" = $3';

const getMembershipByCustId =
    'SELECT "MembershipID" FROM public."Membership" WHERE "CustomerID" = $1';

const addMembership =
    'INSERT INTO "Membership" ("MembershipDuration(months)", "CustomerID") VALUES ($1, $2) RETURNING "MembershipID"';

const removeMembership =
    'DELETE FROM "Membership" WHERE "MembershipID" = $1';

module.exports = {
    getBooks,
    getBookById,
    checkBookexists,
    addBook,
    removeBook,
    updateBook,
    updateQuantity,
    reduceStock,
    getMembershipByCustId,
    addMembership,
    removeMembership,
}