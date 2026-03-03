import type { Operators } from '@niivue/niimath'

/**
 * Parsed niimath command with operation name and arguments.
 */
export interface NiimathCommand {
  op: string
  args: string[]
}

/**
 * Parse a CLI-style niimath command string into structured commands.
 * Input: "-add 5 -mul 2 -thr 100 -s 2.5"
 * Output: [{ op: 'add', args: ['5'] }, { op: 'mul', args: ['2'] }, ...]
 */
export function parseNiimathCommands(input: string, operators: Operators): NiimathCommand[] {
  const tokens = input.trim().split(/\s+/).filter(Boolean)
  const commands: NiimathCommand[] = []
  let i = 0

  while (i < tokens.length) {
    let token = tokens[i]
    if (!token.startsWith('-')) {
      throw new Error(`Expected operation starting with '-', got '${token}'`)
    }
    token = token.slice(1) // remove leading '-'
    const def = operators[token]
    if (!def) {
      throw new Error(`Unknown niimath operation: -${token}`)
    }
    const nArgs = def.args?.length ?? 0
    const args = tokens.slice(i + 1, i + 1 + nArgs)
    if (args.length < nArgs) {
      throw new Error(`Operation -${token} expects ${nArgs} argument(s), got ${args.length}`)
    }
    commands.push({ op: token, args })
    i += 1 + nArgs
  }

  return commands
}
