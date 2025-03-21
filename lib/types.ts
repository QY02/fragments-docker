import { TemplateId } from './templates'
import { ExecutionError, Result } from '@e2b/code-interpreter'

type ExecutionResultBase = {
  sbxId: string
}

export type ExecutionResultInterpreter = ExecutionResultBase & {
  template: 'python-code-interpreter'
  stdout: string[]
  stderr: string[]
  runtimeError?: ExecutionError
  cellResults: Result[]
}

export type ExecutionResultWeb = ExecutionResultBase & {
  template: Exclude<TemplateId, 'python-code-interpreter'>
  url: string
}

export type ExecutionResult = ExecutionResultInterpreter | ExecutionResultWeb
