const { getQcInventoryProducts } = require('./.next/server/app/actions/qc-inventory-actions.js');
// Wait, actions is compiled, we can't easily require it like this.
// Let's use fetch if it was a route, or just write a script that replicates it
