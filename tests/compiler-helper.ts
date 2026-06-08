import { readFileSync } from 'node:fs'
import { compileScript, compileTemplate, parse } from 'vue/compiler-sfc'

interface CompiledComponent {
  script: string
  render: string
  scopeId: string | null
  styles: string[]
}

export function compileSFC(filePath: string): CompiledComponent {
  const source = readFileSync(filePath, 'utf-8')
  const { descriptor } = parse(source)

  const script = compileScript(descriptor, { id: filePath })

  const template = descriptor.template
  if (!template) throw new Error(`No template found in ${filePath}`)

  const compiledTemplate = compileTemplate({
    source: template.content,
    filename: filePath,
    id: filePath,
  })

  return {
    script: script.content,
    render: compiledTemplate.code,
    scopeId: descriptor.styles[0]?.scoped ? `data-v-${filePath}` : null,
    styles: descriptor.styles.map(s => s.content),
  }
}
