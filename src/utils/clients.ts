import type { Guest } from "../types.ts";

export function clientKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-PT");
}

export function groupClients(guests: Guest[]): { name: string; dogs: Guest[] }[] {
  const clients = new Map<string, { name: string; dogs: Guest[] }>();
  for (const guest of guests) {
    const key = clientKey(guest.owner);
    const client = clients.get(key) ?? { name: guest.owner.trim(), dogs: [] };
    client.dogs.push(guest); clients.set(key, client);
  }
  return [...clients.values()];
}
