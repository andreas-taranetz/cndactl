import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { Command } from "commander";

const ZSH_COMPLETION_SCRIPT = `#compdef cndactl

_cndactl() {
  local context state line
  typeset -A opt_args

  _arguments -C \\
    '--no-cache[Disable local cache and always fetch fresh data]' \\
    '--version[Show version information]' \\
    '(-h --help)'{-h,--help}'[Show help]' \\
    '1: :_cndactl_commands' \\
    '*::args:->args'

  case $state in
    args)
      case $words[1] in
        get) _cndactl_get ;;
        describe) _cndactl_describe ;;
        open) _cndactl_open ;;
        completion) _cndactl_completion ;;
      esac
      ;;
  esac
}

_cndactl_commands() {
  local -a commands
  commands=(
    'get:List conference resources'
    'describe:Show detailed resource information'
    'open:Open a URL in the default browser'
    'completion:Generate shell completion script'
  )
  _describe 'command' commands
}

_cndactl_get() {
  local -a subcommands
  subcommands=(
    'sessions:List all sessions'
    'sess:List all sessions'
    'speakers:List all speakers'
    'spk:List all speakers'
    'links:List conference links'
    'link:List conference links'
  )
  _describe 'resource' subcommands
}

_cndactl_describe() {
  local -a subcommands
  subcommands=(
    'session:Show detailed information about a session'
    'sess:Show detailed information about a session'
    'speaker:Show detailed information about a speaker'
    'spk:Show detailed information about a speaker'
  )
  _describe 'resource' subcommands
}

_cndactl_open() {
  _arguments -C \\
    '1: :_cndactl_open_subcommands' \\
    '*::args:->open_args'

  case $state in
    open_args)
      case $words[1] in
        event)
          _message 'link ID (e.g. venue, sessions, team, youtube)'
          ;;
        speaker)
          if (( CURRENT == 2 )); then
            _message 'speaker name or ID'
          elif (( CURRENT == 3 )); then
            local -a link_types
            link_types=(
              'linkedin:LinkedIn profile'
              'blog:Personal blog or website'
              'sessionize:Sessionize speaker page'
              'company-website:Company website'
              'twitter:Twitter/X profile'
              'github:GitHub profile'
            )
            _describe 'link type' link_types
          fi
          ;;
      esac
      ;;
  esac
}

_cndactl_open_subcommands() {
  local -a subcommands
  subcommands=(
    'tickets:Open the ticket purchase page'
    'website:Open the event website'
    'event:Open a specific event link by ID'
    'speaker:Open a speaker link'
  )
  _describe 'target' subcommands
}

_cndactl_completion() {
  local -a subcommands
  subcommands=(
    'install:Install completion script automatically'
  )
  _describe 'action' subcommands
}

_cndactl "$@"
`;

export function generateZshCompletion(): string {
  return ZSH_COMPLETION_SCRIPT;
}

export function registerCompletionCommand(program: Command): void {
  const completionCommand = new Command("completion")
    .description("Generate shell completion script (zsh)")
    .addHelpText("after", "\nExamples:\n  cndactl completion           # Print the completion script\n  cndactl completion install   # Install and configure automatically")
    .action(() => {
      process.stdout.write(generateZshCompletion());
    });

  completionCommand
    .command("install")
    .description("Install the zsh completion script and configure your shell automatically")
    .action(installZshCompletion);

  program.addCommand(completionCommand);
}

function installZshCompletion(): void {
  const zfuncDir = join(homedir(), ".zfunc");
  const completionFile = join(zfuncDir, "_cndactl");

  mkdirSync(zfuncDir, { recursive: true });
  writeFileSync(completionFile, generateZshCompletion(), "utf-8");
  console.log(`✓ Installed completion script to ${completionFile}`);

  const zshrcPath = join(homedir(), ".zshrc");
  const fpathLine = "fpath=(~/.zfunc $fpath)";
  const compinitLine = "autoload -Uz compinit && compinit";

  let zshrcContent = "";
  if (existsSync(zshrcPath)) {
    zshrcContent = readFileSync(zshrcPath, "utf-8");
  }

  const linesToAdd: string[] = [];
  if (!zshrcContent.includes(fpathLine)) {
    linesToAdd.push(fpathLine);
  }
  if (!zshrcContent.includes(compinitLine)) {
    linesToAdd.push(compinitLine);
  }

  if (linesToAdd.length > 0) {
    const addition = `\n# cndactl completions\n${linesToAdd.join("\n")}\n`;
    writeFileSync(zshrcPath, zshrcContent + addition, "utf-8");
    console.log("✓ Updated ~/.zshrc to enable completions");
  } else {
    console.log("✓ ~/.zshrc already configured for completions");
  }

  console.log("\nReload your shell to activate completions:");
  console.log("  source ~/.zshrc");
}
