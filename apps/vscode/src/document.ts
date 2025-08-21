import * as vscode from 'vscode'
import { Disposable } from './dispose'

export class NiiVueDocument
  extends Disposable
  implements vscode.CustomDocument
{
  private readonly _uri: vscode.Uri

  constructor(uri: vscode.Uri) {
    super()
    this._uri = uri
  }

  public get uri() {
    return this._uri
  }

  private readonly _onDidDispose = this._register(
    new vscode.EventEmitter<void>(),
  )
  public readonly onDidDispose = this._onDidDispose.event

  dispose(): void {
    this._onDidDispose.fire()
    super.dispose()
  }
}
