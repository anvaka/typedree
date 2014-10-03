var createQuadTree = require('../');

var n = 100000;
var bounds = {
  x: 0,
  y: 0,
  width: 101 * n,
  height: 101 * n
};

var tree = createQuadTree(bounds);
var bodies = createBodies(n);

bodies.forEach(function(body) {
  tree.insert(body);
});

tree.updateForces();

function createBodies(n) {
  var bodies = [];
  for (var i = 0; i < n; ++i) {
    var x = Math.random() * 100 * n;
    var y = Math.random() * 100 * n;
    bodies.push({
      x : x,
      y: y,
      mass: Math.random() * 78,
      fx : 0,
      fy: 0
    });
    if (x > bounds.width) {
      bounds.width = x + 1;
    }
    if (y > bounds.height) {
      bounds.height = y + 1;
    }
  }
  return bodies;
}
