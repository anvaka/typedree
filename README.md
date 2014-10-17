# typedree

Experimental implementation of quadtree with typed arrays. Turned out this particular approach is much slower
than original implementation.

This implementation: 

```
Base case x 3.50 ops/sec ±1.55% (13 runs sampled)
```

Original [quadtree implementation](https://github.com/anvaka/ngraph.quadtreebh):

```
Base case x 8.65 ops/sec ±5.20% (26 runs sampled)
```


# install

With [npm](https://npmjs.org) do:

```
npm install typedree
```

# license

MIT
