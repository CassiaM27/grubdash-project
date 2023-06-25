const router = require("express").Router();
const controller = require("./orders.controller")
const methodNotAllowed = require("../errors/methodNotAllowed")

// TODO: Implement the /orders routes needed to make the tests pass

//const pastesRouter = require("../pastes/pastes.router");
//router.use("/:userId/pastes", controller.userExists, pastesRouter);

//const dishesRouter = require("../dishes/dishes.router");
//router.use("/:orderId/dishes", controller.orderExists, dishesRouter);

router.route("/:orderId")
  .get(controller.read)
  .put(controller.update)
  .delete(controller.delete)
  .all(methodNotAllowed)

router.route("/")
  .get(controller.list)
  .post(controller.create)
  .all(methodNotAllowed)

module.exports = router;
