const orders = [
  { id: 1, dateCreated: "2023-01-01T10:00:00Z", updatedAt: "2023-01-05T10:00:00Z" },
  { id: 2, dateCreated: "2023-01-02T10:00:00Z", updatedAt: "2023-01-04T10:00:00Z" }
];

const completedOrders = orders.sort((a, b) => new Date(b.updatedAt || b.dateCreated).getTime() - new Date(a.updatedAt || a.dateCreated).getTime());
console.log(completedOrders);
