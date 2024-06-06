const {Router} = require('express');
const controller = require('./controller');

const router = Router();
router.get('/book/', controller.getBooks);
router.get('/book/:id', controller.getBookById);
router.post('/add/book', controller.addBook);
router.delete('/remove/book/:id', controller.removeBook);
router.put('/update/book/:id', controller.updateBook);
router.post('/book/query', controller.buildQuery);
router.post('/update/inventory', controller.InventoryUpdate);

// Add and remove membership routes
router.post('/add/membership/:customerId', controller.addMembership);
router.delete('/remove/membership/:customerId', controller.removeMembership);

module.exports = router;
