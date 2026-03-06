import open from "open";

type OpenImplementation = (url: string) => Promise<unknown> | unknown;

let openImplementation: OpenImplementation = open;

export function setOpenImplementationForTests(implementation: OpenImplementation): void {
  openImplementation = implementation;
}

export function resetOpenImplementationForTests(): void {
  openImplementation = open;
}

export async function openUrl(url: string): Promise<void> {
  await openImplementation(url);
}