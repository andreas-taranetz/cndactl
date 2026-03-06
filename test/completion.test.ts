import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";

import { generateZshCompletion, registerCompletionCommand } from "../src/commands/completion.js";

describe("generateZshCompletion", () => {
  it("returns a non-empty string", () => {
    const script = generateZshCompletion();
    expect(script).toBeTruthy();
    expect(typeof script).toBe("string");
  });

  it("starts with the #compdef directive", () => {
    expect(generateZshCompletion()).toMatch(/^#compdef cndactl/);
  });

  it("includes completion functions for all top-level commands", () => {
    const script = generateZshCompletion();
    expect(script).toContain("get:List conference resources");
    expect(script).toContain("describe:Show detailed resource information");
    expect(script).toContain("open:Open a URL in the default browser");
    expect(script).toContain("completion:Generate shell completion script");
  });

  it("includes completion functions for get subcommands", () => {
    const script = generateZshCompletion();
    expect(script).toContain("sessions:List all sessions");
    expect(script).toContain("speakers:List all speakers");
    expect(script).toContain("links:List conference links");
  });

  it("includes completion functions for describe subcommands", () => {
    const script = generateZshCompletion();
    expect(script).toContain("session:Show detailed information about a session");
    expect(script).toContain("speaker:Show detailed information about a speaker");
  });

  it("includes completion functions for open subcommands", () => {
    const script = generateZshCompletion();
    expect(script).toContain("tickets:Open the ticket purchase page");
    expect(script).toContain("website:Open the event website");
    expect(script).toContain("event:Open a specific event link by ID");
    expect(script).toContain("speaker:Open a speaker link");
  });

  it("includes known speaker link types", () => {
    const script = generateZshCompletion();
    expect(script).toContain("linkedin");
    expect(script).toContain("sessionize");
  });

  it("includes --no-cache global option", () => {
    expect(generateZshCompletion()).toContain("--no-cache");
  });
});

describe("registerCompletionCommand", () => {
  it("registers a completion command on the program", () => {
    const program = new Command();
    registerCompletionCommand(program);
    const cmd = program.commands.find((c) => c.name() === "completion");
    expect(cmd).toBeDefined();
  });

  it("registers a completion install subcommand", () => {
    const program = new Command();
    registerCompletionCommand(program);
    const completionCmd = program.commands.find((c) => c.name() === "completion");
    const installCmd = completionCmd?.commands.find((c) => c.name() === "install");
    expect(installCmd).toBeDefined();
  });

  it("outputs the zsh completion script to stdout when run", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const program = new Command();
    registerCompletionCommand(program);

    await program.parseAsync(["node", "test", "completion"]);

    expect(writeSpy).toHaveBeenCalledWith(generateZshCompletion());

    writeSpy.mockRestore();
  });
});
