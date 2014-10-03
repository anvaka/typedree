var Benchmark = require('benchmark');

var createQuadTree = require('../'),
    numberOfBodies = 10000;

console.log('Bodies #' + numberOfBodies);
var suite = new Benchmark.Suite;

  var b  = createBodies(numberOfBodies);
  var tree = createQuadTree(b.bounds);
  var bodies = b.bodies;
  for (var i = 0; i < bodies.length; ++i) {
    tree.insert(bodies[i]);
  }

  tree.updateForces();
// add tests
suite.add('Base case', function() {
  var b  = createBodies(numberOfBodies);
  var tree = createQuadTree(b.bounds);
  var bodies = b.bodies;
  for (var i = 0; i < bodies.length; ++i) {
    tree.insert(bodies[i]);
  }

  tree.updateForces();
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
// run async
.run({ 'async': true });

function createBodies(n) {
  var bodies = [];
  var bounds = {
    x: 0,
    y: 0,
    width: 101 * n,
    height: 101 * n
  };
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

  return {
    bodies: bodies,
    bounds: bounds
  };
}
