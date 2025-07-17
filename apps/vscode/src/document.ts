import * as vscode from 'vscode'
import { Disposable } from './dispose'

export class NiiVueDocument
  extends Disposable
  implements vscode.CustomDocument
{
  private readonly _uri: vscode.Uri
  private readonly _data: Uint8Array

  constructor(uri: vscode.Uri, data: Uint8Array) {
    super()
    this._uri = uri
    this._data = data
  }

  public get uri() {
    return this._uri
  }
  public get data() {
    return this._data
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
