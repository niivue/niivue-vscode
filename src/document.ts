import * as vscode from 'vscode';
import { Disposable } from './dispose';

export class NiiVueDocument extends Disposable implements vscode.CustomDocument {
    private readonly _uri: vscode.Uri;
    private readonly _data: Uint8Array;
    private _overlay: Uint8Array | undefined;

    constructor(
        uri: vscode.Uri,
        data: Uint8Array,
        overlay: Uint8Array | undefined = undefined,
    ) {
        super();
        this._uri = uri;
        this._data = data;
        this._overlay = overlay;
    }

    public get uri() { return this._uri; }
    public get data() { return this._data; }
    // Workaround that returns data if overlay is undefined
    public get overlay() { return this._overlay ? this._overlay : this._data; }
    public set overlay(overlay: Uint8Array) { this._overlay = overlay; }

    private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());
    public readonly onDidDispose = this._onDidDispose.event;

    dispose(): void {
        this._onDidDispose.fire();
        super.dispose();
    }
}