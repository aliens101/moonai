/**
 * The tools the brain can call, grouped by category (count derived below).
 * Used by Section 2 V5 (Limbs grid).
 */

export type Tool = { name: string; desc: string }
export type ToolCategory = { label: string; tools: Tool[] }

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    label: 'fs',
    tools: [
      { name: 'fs.read', desc: 'read a file from disk' },
      { name: 'fs.write', desc: 'write a file to disk' },
      { name: 'fs.patch', desc: 'apply a substring patch to a file' },
      { name: 'fs.search', desc: 'glob + ripgrep across a directory tree' },
    ],
  },
  {
    label: 'shell',
    tools: [
      { name: 'shell.run', desc: 'execute a shell command (sandboxed)' },
      { name: 'shell.cd', desc: 'change working directory' },
      { name: 'shell.process_start', desc: 'start a long-lived background process' },
      { name: 'shell.process_output', desc: 'read output from a running process' },
      { name: 'shell.process_list', desc: 'list active background processes' },
      { name: 'shell.process_kill', desc: 'terminate a background process' },
    ],
  },
  {
    label: 'browser',
    tools: [
      { name: 'browser.navigate', desc: 'load a URL' },
      { name: 'browser.snapshot', desc: 'capture accessibility tree' },
      { name: 'browser.click', desc: 'click an element' },
      { name: 'browser.type', desc: 'type text into a field' },
      { name: 'browser.scroll', desc: 'scroll page or element' },
      { name: 'browser.press', desc: 'press a key' },
      { name: 'browser.back', desc: 'navigate back in history' },
      { name: 'browser.get_images', desc: 'extract images from page' },
      { name: 'browser.console', desc: 'read browser console output' },
      { name: 'browser.vision', desc: 'describe what is on screen' },
    ],
  },
  {
    label: 'sui',
    tools: [
      { name: 'sui.balance', desc: 'read agent balance (SUI)' },
      { name: 'sui.send', desc: 'transfer SUI or any coin (gated)' },
      { name: 'sui.read', desc: 'fetch object / dynamic field' },
      { name: 'move.call', desc: 'call any Move entry function (gated)' },
      { name: 'sui.block', desc: 'read checkpoint details' },
      { name: 'sui.gas', desc: 'reference gas price + SUI cost of common ops' },
      { name: 'sui.tx', desc: 'fetch + decode tx digest' },
      { name: 'sui.package', desc: 'introspect package + module ABI' },
      { name: 'sui.activity', desc: 'recent transfers, optional decode' },
    ],
  },
  {
    label: 'trade',
    tools: [
      { name: 'deepbook.markets', desc: 'DeepBook order books + live depth' },
      { name: 'deepbook.order', desc: 'place a DeepBook limit/market order (gated)' },
      { name: 'cetus.quote', desc: 'Cetus CLMM quote, multi-tier scan' },
      { name: 'cetus.swap', desc: 'Cetus swap (gated)' },
      { name: 'turbos.quote', desc: 'Turbos quote, read-only' },
      { name: 'coin.info', desc: 'Sui coin metadata (type, decimals, supply)' },
    ],
  },
  {
    label: 'lend',
    tools: [
      { name: 'navi.markets', desc: 'NAVI live supply/borrow rates' },
      { name: 'navi.position', desc: 'NAVI position + health factor' },
      { name: 'navi.supply', desc: 'NAVI supply collateral (gated)' },
      { name: 'navi.withdraw', desc: 'NAVI withdraw (gated)' },
      { name: 'scallop.markets', desc: 'Scallop money-market rates' },
      { name: 'scallop.supply', desc: 'Scallop supply / borrow (gated)' },
    ],
  },
  {
    label: 'risk',
    tools: [
      { name: 'defi.yields', desc: 'DeFiLlama Sui yields + RWA flags, read-only' },
      { name: 'protocols.list', desc: 'live Sui protocol + TVL registry, read-only' },
      { name: 'risk.coin', desc: 'pre-trade coin vet: exit / liquidity / restricted' },
      { name: 'policy.show', desc: 'the active moonai::policy fund-control object' },
      { name: 'policy.create', desc: 'mint / update a policy object (gated)' },
      { name: 'tx.simulate', desc: 'dry-run any PTB before broadcasting' },
    ],
  },
  {
    label: 'account',
    tools: [
      { name: 'account.info', desc: 'agent identity + coin snapshot' },
      { name: 'walrus.store', desc: 'store memory / receipts on Walrus' },
    ],
  },
  {
    label: 'memory',
    tools: [
      { name: 'memory.save', desc: 'write to the local store' },
      { name: 'memory.read', desc: 'read a memory note' },
    ],
  },
  {
    label: 'skills',
    tools: [
      { name: 'skills.list', desc: 'available skills' },
      { name: 'skills.view', desc: 'read a skill body' },
      { name: 'skills.manage', desc: 'enable/disable skills' },
    ],
  },
  {
    label: 'meta',
    tools: [
      { name: 'code.execute', desc: 'sandboxed python/node eval' },
      { name: 'vision.analyze', desc: 'image understanding' },
      { name: 'delegate.task', desc: 'spawn a subagent' },
      { name: 'session.search', desc: 'recall past tool calls' },
      { name: 'web.fetch', desc: 'plain HTTP fetch' },
      { name: 'todo', desc: 'task tracking' },
      { name: 'clarify', desc: 'ask the operator a question' },
      { name: 'tool.search', desc: 'discover deferred tools' },
    ],
  },
]

export const TOTAL_TOOL_COUNT = TOOL_CATEGORIES.reduce((acc, cat) => acc + cat.tools.length, 0)
