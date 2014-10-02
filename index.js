//0 - bodyid
//1 - mass
//2 - massx
//3 - massy
//4 - left
//5 - righ
//6 - top
//7 - bottom
//8 - quad 0
//9 - quad 1
//10 - quad 2
//11 - quad 3
module.exports = createQuadTree;

function createQuadTree(bounds) {
  var ELEMENTS_PER_NODE = 12;
  var bodies = [],
    gravity = -1,
    theta = 0.8,
    lastChildIdx = 0,
    tree = new Float64Array(100000 * ELEMENTS_PER_NODE);

  tree[4] = bounds.x;
  tree[5] = bounds.x + bounds.width;
  tree[6] = bounds.y;
  tree[7] = bounds.y + bounds.top;

  return {
    insert: insertBody,
    updateForces: updateForces
  };

  function insertBody(body) {
    var bodyId = bodies.push(body);
    if (lastChildIdx === 0) {
      tree[0] = bodyId;
      tree[1] = body.mass;
      tree[2] = body.mass * body.x;
      tree[3] = body.mass * body.y;
      lastChildIdx += ELEMENTS_PER_NODE;
    } else {
      insertRaw(body.x, body.y, body.mass, bodyId, 0);
    }
  }

  function updateForces() {
    bodies.forEach(function(body, idx) {
      updateBodyForces(idx + 1, 0);
    });
  }

  function updateBodyForces(sourceBodyId, offset) {
    var dx, dy, r, v;
    var sourceBody, body;

    var bodyId = tree[offset];
    if (bodyId && bodyId !== sourceBodyId) {
      body = bodies[bodyId - 1];
      sourceBody = bodies[sourceBodyId - 1];
      // If the current node is a leaf node (and it is not source body),
      // calculate the force exerted by the current node on body, and add this
      // amount to body's net force.
      dx = body.x - sourceBody.x;
      dy = body.y - sourceBody.y;
      r = Math.sqrt(dx * dx + dy * dy);

      if (r === 0) {
        // Poor man's protection against zero distance.
        dx = (Math.random() - 0.5) / 50;
        dy = (Math.random() - 0.5) / 50;
        r = Math.sqrt(dx * dx + dy * dy);
      }

      // This is standard gravition force calculation but we divide
      // by r^3 to save two operations when normalizing force vector.
      v = gravity * body.mass * sourceBody.mass / (r * r * r);
      sourceBody.fx += v * dx;
      sourceBody.fy += v * dy;
    } else {
      // Otherwise, calculate the ratio s / r,  where s is the width of the region
      // represented by the internal node, and r is the distance between the body
      // and the node's center-of-mass
      sourceBody = bodies[sourceBodyId - 1];
      dx = tree[offset + 2]/ tree[offset + 1] - sourceBody.x;
      dy = tree[offset + 3]/ tree[offset + 1] - sourceBody.y;
      r = Math.sqrt(dx * dx + dy * dy);

      if (r === 0) {
        // Sorry about code duplucation. I don't want to create many functions
        // right away. Just want to see performance first.
        dx = (random.nextDouble() - 0.5) / 50;
        dy = (random.nextDouble() - 0.5) / 50;
        r = Math.sqrt(dx * dx + dy * dy);
      }
      // If s / r < θ, treat this internal node as a single body, and calculate the
      // force it exerts on sourceBody, and add this amount to sourceBody's net force.
      if ((tree[offset + 5] - tree[offset + 4]) / r < theta) {
        // in the if statement above we consider node's width only
        // because the region was squarified during tree creation.
        // Thus there is no difference between using width or height.
        v = gravity * tree[offset + 1] * sourceBody.mass / (r * r * r);
        sourceBody.fx += v * dx;
        sourceBody.fy += v * dy;
      } else {
        // Otherwise, run the procedure recursively on each of the current node's children.
        // I intentionally unfolded this loop, to save several CPU cycles.
        if (tree[offset + 8]) {
          updateBodyForces(sourceBodyId, tree[offset + 8]);
        }
        if (tree[offset + 9]) {
          updateBodyForces(sourceBodyId, tree[offset + 9]);
        }
        if (tree[offset + 10]) {
          updateBodyForces(sourceBodyId, tree[offset + 10]);
        }
        if (tree[offset + 11]) {
          updateBodyForces(sourceBodyId, tree[offset + 11]);
        }
      }
    }
  }

  function insertRaw(x, y, mass, body, offset) {
    // start with root:
    var oldBody = tree[offset];
    if (oldBody === 0) {
      insertInternalNode(x, y, mass, body, offset);
    } else {
      insertLeafNode(x, y, mass, body, offset, oldBody);
    }
  }

  function insertLeafNode(x, y, mass, body, offset, oldBody) {
    // We are trying to add to the leaf node.
    // We have to convert current leaf into internal node
    // and continue adding two nodes.
    tree[offset] = 0; // internal nodes do not cary bodies

    if (isSamePosition(oldBody, body)) {
      // Prevent infinite subdivision by bumping one node
      // anywhere in this quadrant
      var right = tree[offset + 5];
      var left = tree[offset + 4];
      var top = tree[offset + 6];
      var bottom = tree[offset + 7];

      if (right - left < 1e-8) {
        // This is very bad, we ran out of precision.
        // if we do not return from the method we'll get into
        // infinite loop here. So we sacrifice correctness of layout, and keep the app running
        // Next layout iteration should get larger bounding box in the first step and fix this
        return;
      }
      do {
        var bump = Math.random(); // todo: should be deterministic
        var dx = (right - left) * bump;
        var dy = (bottom - top) * bump;

        setBodyPos(oldBody, left + dx, top + dy);
        // Make sure we don't bump it out of the box. If we do, next iteration should fix it
      } while (isSamePosition(oldBody, body));
    }
    // Next iteration should subdivide node further.
    reinsertOldBody(oldBody, offset);
    insertRaw(x, y, mass, body, offset);
  }

  function insertInternalNode(x, y, mass, body, offset) {
    // This is internal node. Update the total mass of the node and center-of-mass.
    tree[offset + 1] += mass;
    tree[offset + 2] += mass * x;
    tree[offset + 3] += mass * y;

    // Recursively insert the body in the appropriate quadrant.
    // But first find the appropriate quadrant.
    var quadIdx = 0, // Assume we are in the 0's quad.
      left = tree[offset + 4],
      right = (tree[offset + 5] + left) / 2,
      top = tree[offset + 6],
      bottom = (tree[offset + 7] + top) / 2;

    if (x > right) { // somewhere in the eastern part.
      quadIdx = quadIdx + 1;
      var oldLeft = left;
      left = right;
      right = right + (right - oldLeft);
    }
    if (y > bottom) { // and in south.
      quadIdx = quadIdx + 2;
      var oldTop = top;
      top = bottom;
      bottom = bottom + (bottom - oldTop);
    }

    var child = tree[offset + 8 + quadIdx];
    if (!child) {
      // The node is internal but this quadrant is not taken. Add
      // subnode to it.
      lastChildIdx += ELEMENTS_PER_NODE;

      tree[lastChildIdx + 4] = left;
      tree[lastChildIdx + 6] = top;
      tree[lastChildIdx + 5] = right;
      tree[lastChildIdx + 7] = bottom;
      tree[lastChildIdx + 0] = body;

      tree[offset + 8 + quadIdx] = lastChildIdx;
    } else {
      // continue searching in this quadrant.
      insertRaw(x, y, mass, body, child);
    }
  }

  function isSamePosition(body1, body2) {
    var point1 = bodies[body1 - 1];
    var point2 = bodies[body2 - 1];

    var dx = Math.abs(point1.x - point2.x);
    var dy = Math.abs(point1.y - point2.y);

    return (dx < 1e-8 && dy < 1e-8);
  }

  function setBodyPos(bodyId, x, y) {
    var body = bodies[bodyId - 1];
    body.x = x;
    body.y = y;
  }

  function reinsertOldBody(bodyId, offset) {
    var body = bodies[bodyId - 1];
    insertRaw(body.x, body.y, body.mass, bodyId, offset);
  }
}
