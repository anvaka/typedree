var createQuadTree = require('../');

var bounds = {
  x: 0,
  y: 0,
  width: 100,
  height: 100
};

var tree = createQuadTree(bounds);
var bodies = createBodies(2);

bodies.forEach(function (body) {
  tree.insert(body);
});

tree.updateForces();

bodies.forEach(function (body, i) {
  console.log(i, body.fx, body.fy);
});

function createBodies(n) {
  var bodies = [];
  for (var i = 0; i < n; ++i) {
    bodies.push({ x: Math.random() * 100, y: Math.random() * 100, mass: Math.random() * 78 });
  }
  return bodies;
}
