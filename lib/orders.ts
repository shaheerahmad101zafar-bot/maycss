import "server-only";

import {
  normalizeStatus,
  type Order,
  type OrderStatusEvent,
} from "./orders-types";
import { readStoreJson, writeStoreJson } from "./storage/json-store";

// Re-export everything from orders-types so server callers can keep using
// `import { ... } from "@/lib/orders"` unchanged.
export * from "./orders-types";

const ordersFile = "data/orders.json";

async function readJson<T>(relativePath: string, fallback: T): Promise<T> {
  return readStoreJson(relativePath, fallback);
}

async function writeJson(relativePath: string, data: unknown): Promise<void> {
  await writeStoreJson(relativePath, data);
}

function migrateOrder(
  o: Partial<Order> & Pick<Order, "id" | "createdAt">,
): Order {
  const status = normalizeStatus(o.status);
  const history = Array.isArray(o.statusHistory) ? o.statusHistory : [];
  const normalized: OrderStatusEvent[] = history.map((e) => ({
    from: e.from ? normalizeStatus(e.from) : null,
    to: normalizeStatus(e.to),
    at: e.at,
    by: e.by ?? "system",
    note: e.note,
  }));
  const statusHistory: OrderStatusEvent[] =
    normalized.length > 0
      ? normalized
      : [
          {
            from: null,
            to: status,
            at: o.createdAt,
            by: "system",
            note: "Order placed.",
          },
        ];
  return { ...(o as Order), status, statusHistory };
}

export async function getOrders(): Promise<Order[]> {
  const rows = await readJson<
    Array<Partial<Order> & Pick<Order, "id" | "createdAt">>
  >(ordersFile, []);
  return rows.map(migrateOrder);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await getOrders();
  return orders.find((o) => o.id === id);
}

export async function saveOrder(order: Order): Promise<void> {
  const orders = await getOrders();
  orders.unshift(order);
  await writeJson(ordersFile, orders);
}

export async function replaceOrder(order: Order): Promise<void> {
  const orders = await getOrders();
  const next = orders.map((o) => (o.id === order.id ? order : o));
  await writeJson(ordersFile, next);
}
