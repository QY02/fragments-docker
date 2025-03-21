'use client'

import { FragmentInterpreter } from './fragment-interpreter'
import { FragmentWeb } from './fragment-web'
import { ExecutionResult } from '@/lib/types'

export function FragmentPreview({ result }: { result: ExecutionResult }) {
  if (result.template === 'python-code-interpreter') {
    return <FragmentInterpreter result={result} />
  }

  return <FragmentWeb result={result} />
}
