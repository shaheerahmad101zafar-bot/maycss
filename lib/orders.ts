import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  normalizeStatus,
  type Order,
  type OrderStatusEvent,
} from "./orders-types";

// Re-export everything from orders-types so server callers can keep using
// `import { ... } from "@/lib/orders"` unchanged.
export * from "./orders-types";

const ordersFile = path.join(process.cwd(), "data", "orders.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
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
