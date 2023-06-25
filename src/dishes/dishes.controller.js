const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// primary validation
function dishHas(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body
  
 if(!name || name === ""){
    next({
      status: 400, 
      message: "A name is required"
    })
  } else if(!description || description === "") {
    next({
      status: 400, 
      message: "A description is required"
    })
  } else if (!price) {
    return next({
      status: 400,
      message: "Dish must include a price"
    });
  } else if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  } else if(!image_url || image_url === "") {
    next({
      status: 400, 
      message: "An image_url is required"
    })
  } else {
    res.locals.body = req.body.data;
    next()
  }
}

// extra validation for updated dishes only
function idPropertyIsValid(req, res, next) {
  const { dishId } = req.params
  const { data: { id } = {} } = req.body;
  const validId = [dishId, "", null, undefined];
  if (validId.includes(id)) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

// check if dish exists in database
function dishExists(req, res, next) {
  const { dishId } = req.params
  const foundDish = dishes.find((dish) => dish.id === dishId)
   
  if (foundDish) {
    res.locals.dish = foundDish
    return next()
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`
  })
}

// make new dish with unique id
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish })
  next()
}

// update dish based on name, must also match id IF one is provided by the route
function update(req, res) {
  const dish = res.locals.dish
  const { data: { name, description, price, image_url } = {} } = req.body
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.json({ data: dish })
}

function list(req, res) {
  res.json({ data: dishes })
}

module.exports = {
  create: [dishHas, create],
  read: [dishExists, read],
  update: [dishExists, dishHas, idPropertyIsValid, update],
  list,
}


