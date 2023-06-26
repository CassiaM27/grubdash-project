const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function orderHas(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
  let message = '';
  
  if(!deliverTo || deliverTo === "") {
    message = "Order must include a deliverTo";
  } else if(!mobileNumber || mobileNumber === "") {
    message = "Order must include a mobileNumber";
  } else if(!dishes) {
    message = "Order must include a dish";
  } else if(!Array.isArray(dishes) || dishes.length === 0) {
    message = "Order must include at least one dish";
  } else {
    for(let i = 0; i < dishes.length; i++) {
      if(!dishes[i].quantity || dishes[i].quantity <= 0 || !Number.isInteger(dishes[i].quantity)) {
        message = `Dishes ${i} must have a quantity greater than 0`;
      }
    }
  }
  if(message) {
    return next({
      status: 400,
      message: message,
    });
  }
  next();
}

// extra validation for updated orders only
function idPropertyIsValid(req, res, next) {
  const { orderId } = req.params
  const { data: { id } = {} } = req.body;
  const validId = [orderId, "", null, undefined];
  if (validId.includes(id)) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
  });
}

// extra validation for updated orders only
function statusPropertyIsValidUpdate(req, res, next) {
  const { orderId } = req.params;
  const { data: { id, status } = {} } = req.body;
  let message = '';
  
  if(id && id !== orderId) {
    message = `Order id does not match route id. Order: ${id}, Route: ${orderId}`
  } else if(!status || status === "" || (status !== "pending" &&  status !== "preparing" && status !== "out-for-delivery")) {
    message = "Order must have a status of pending, preparing, out-for-delivery, delivered";
  } else if (status === 'delivered') {
    message = "A delivered order cannot be changed"
  }
  
  if(message) {
    next({
      status: 400,
      message: message
    });
  } else {
    return next();
  }

}

// extra validation for deleted orders only
function statusPropertyIsValidDelete(req, res, next) {
  const { status } = res.locals.order
  const validStatus = 'pending';
  if (validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending.`,
  });
}

// check if order exists in database
function orderExists(req, res, next) {
  const { orderId } = req.params
  const foundOrder = orders.find((order) => order.id === orderId)
   
  if (foundOrder) {
    res.locals.order = foundOrder
    return next()
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`
  })
}

function list(req, res) {
  res.json({ data: orders })
}

// make new dish with unique id
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes: [dish, quantity] } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes: [dish, quantity],
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order })
  next()
}

// update order based on name, must also match id IF one is provided by the route
function update(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
  
  const order = res.locals.order
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.dishes = dishes;
  order.status = status;
  res.json({ data: order })
}

function destroy(req, res, next) {
  const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === Number(orderId));
    // `splice()` returns an array of the deleted elements, even if it is one element
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    orderHas,
    create
  ],
  read: [
    orderExists,
    read
  ],
  update: [
    orderExists,
    orderHas,
    idPropertyIsValid,
    statusPropertyIsValidUpdate,
    update
  ],
  delete: [
    orderExists,
    statusPropertyIsValidDelete,
    destroy
  ],
  orderExists,
}
